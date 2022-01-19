# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

"""
Adapted from https://github.com/dsgissin/DiscriminativeActiveLearning
"""
import ctypes
import gc
import logging
import threading

import mip
import numpy as np
from mip import BINARY, xsum
from scipy.spatial import distance_matrix


def get_unlabeled_idx(X_train, labeled_idx):
    """
    Given the training set and the indices of the labeled examples, return the indices of the unlabeled examples.
    """
    return np.arange(X_train.shape[0])[np.logical_not(np.in1d(np.arange(X_train.shape[0]), labeled_idx))]


class RaisingThread(threading.Thread):
    " A thread that the callee could raise exceptions in it."
    def __init__(self, group=None, target=None, name=None,
                 args=(), kwargs=None, *, daemon=None):
        threading.Thread.__init__(self, group, target, name,
                                  args=args, kwargs=kwargs, daemon=daemon)
        self.name = name

    def get_id(self):

        # returns id of the respective thread
        if hasattr(self, '_thread_id'):
            return self._thread_id
        for id, thread in threading._active.items():
            if thread is self:
                return id

    def raise_exception(self):
        """Raises the given exception type in the context of this thread.

                If the thread is busy in a system call (time.sleep(),
                socket.accept(), ...), the exception is simply ignored.

                If you are sure that your exception should terminate the thread,
                one way to ensure that it works is:

                    t = ThreadWithExc( ... )
                    ...
                    t.raiseExc( SomeException )
                    while t.isAlive():
                        time.sleep( 0.1 )
                        t.raiseExc( SomeException )

                If the exception is to be caught by the thread, you need a way to
                check that your thread has caught it.

                CAREFUL : this function is executed in the context of the
                caller thread, to raise an excpetion in the context of the
                thread represented by this instance.
                """
        thread_id = self.get_id()
        res = ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id,
                                                         ctypes.py_object(SystemExit))
        if res > 1:
            ctypes.pythonapi.PyThreadState_SetAsyncExc(thread_id, 0)
            logging.warning('Exception raise failure')


class CoreSetMIPSampling:
    """
    An implementation of the core set query strategy with the MIPMIP formulation.
    """

    def __init__(self, robustness_percentage=10 ** 4, max_seconds=180, max_nodes=20000, greedy=False):
        self.robustness_percentage = robustness_percentage
        self.subsample = False
        self.max_seconds = max_seconds
        self.max_nodes = max_nodes
        self.greedy = greedy

    def greedy_k_center(self, labeled, unlabeled, amount):
        greedy_indices = []

        # get the minimum distances between the labeled and unlabeled examples (iteratively, to avoid memory issues):
        min_dist = np.min(distance_matrix(labeled[0, :].reshape((1, labeled.shape[1])), unlabeled), axis=0)
        min_dist = min_dist.reshape((1, min_dist.shape[0]))
        for j in range(1, labeled.shape[0], 100):
            if j + 100 < labeled.shape[0]:
                dist = distance_matrix(labeled[j:j + 100, :], unlabeled)
            else:
                dist = distance_matrix(labeled[j:, :], unlabeled)
            min_dist = np.vstack((min_dist, np.min(dist, axis=0).reshape((1, min_dist.shape[1]))))
            min_dist = np.min(min_dist, axis=0)
            min_dist = min_dist.reshape((1, min_dist.shape[0]))

        # iteratively insert the farthest index and recalculate the minimum distances:
        farthest = np.argmax(min_dist)
        greedy_indices.append(farthest)
        for i in range(amount - 1):
            if i % (amount // 5) == 0:
                print("At Point " + str(i))
            dist = distance_matrix(unlabeled[greedy_indices[-1], :].reshape((1, unlabeled.shape[1])), unlabeled)
            min_dist = np.vstack((min_dist, dist.reshape((1, min_dist.shape[1]))))
            min_dist = np.min(min_dist, axis=0)
            min_dist = min_dist.reshape((1, min_dist.shape[0]))
            farthest = np.argmax(min_dist)
            greedy_indices.append(farthest)

        return np.array(greedy_indices, dtype=int), np.max(min_dist)

    def get_distance_matrix(self, X, Y):
        import tensorflow.keras.backend as K
        x_input = K.placeholder(X.shape)
        y_input = K.placeholder(Y.shape)
        dot = K.dot(x_input, K.transpose(y_input))
        x_norm = K.reshape(K.sum(K.pow(x_input, 2), axis=1), (-1, 1))
        y_norm = K.reshape(K.sum(K.pow(y_input, 2), axis=1), (1, -1))
        dist_mat = x_norm + y_norm - 2.0 * dot
        sqrt_dist_mat = K.sqrt(K.clip(dist_mat, min_value=0, max_value=10000))
        dist_func = K.function([x_input, y_input], [sqrt_dist_mat])

        return dist_func([X, Y])[0]

    def get_neighborhood_graph(self, representation, delta):

        graph = {}
        print(representation.shape)
        for i in range(0, representation.shape[0], 1000):

            if i + 1000 > representation.shape[0]:
                distances = self.get_distance_matrix(representation[i:], representation)
                amount = representation.shape[0] - i
            else:
                distances = self.get_distance_matrix(representation[i:i + 1000], representation)
                amount = 1000

            distances = np.reshape(distances, (amount, -1))
            for j in range(i, i + amount):
                graph[j] = [(idx, distances[j - i, idx]) for idx in
                            np.reshape(np.where(distances[j - i, :] <= delta), (-1))]

        print("Finished Building Graph!")
        return graph

    def get_graph_max(self, representation, delta):

        print("Getting Graph Maximum...")

        maximum = 0
        for i in range(0, representation.shape[0], 1000):
            print("At Point " + str(i))

            if i + 1000 > representation.shape[0]:
                distances = self.get_distance_matrix(representation[i:], representation)
            else:
                distances = self.get_distance_matrix(representation[i:i + 1000], representation)

            distances = np.reshape(distances, (-1))
            distances[distances > delta] = 0
            maximum = max(maximum, np.max(distances))

        return maximum

    def get_graph_min(self, representation, delta):

        print("Getting Graph Minimum...")

        minimum = 10000
        for i in range(0, representation.shape[0], 1000):
            print("At Point " + str(i))

            if i + 1000 > representation.shape[0]:
                distances = self.get_distance_matrix(representation[i:], representation)
            else:
                distances = self.get_distance_matrix(representation[i:i + 1000], representation)

            distances = np.reshape(distances, (-1))
            distances[distances < delta] = 10000
            minimum = min(minimum, np.min(distances))

        return minimum

    def mip_model(self, representation, labeled_idx, budget, delta, outlier_count, greedy_indices=None):

        model = mip.Model("Core Set Selection")
        # set up the variables:
        points = {}
        outliers = {}
        feasible_start = []
        for i in range(representation.shape[0]):
            if i in labeled_idx:
                points[i] = model.add_var(ub=1.0, lb=1.0, var_type=BINARY, name="points_{}".format(i))
            else:
                points[i] = model.add_var(var_type=BINARY, name="points_{}".format(i))
        for i in range(representation.shape[0]):
            name = "outliers_{}".format(i)
            outliers[i] = model.add_var(var_type=BINARY, name=name)
            # outliers[i].start = 0
            feasible_start.append((outliers[i], 0.0))

        # initialize the solution to be the greedy solution:
        if greedy_indices is not None:
            for i in greedy_indices:
                # points[i].start = 1.0 # gurobi
                feasible_start.append((points[i], 1))
            model.start = feasible_start
        # set the outlier budget:
        model.add_constr(xsum(outliers[i] for i in outliers) <= outlier_count, "budget")

        # build the graph and set the constraints:
        model.add_constr(xsum(points[i] for i in range(representation.shape[0])) == budget, "budget")
        neighbors = {}
        graph = {}
        print("Updating Neighborhoods In MIP Model...")
        for i in range(0, representation.shape[0], 1000):
            print("At Point " + str(i))

            if i + 1000 > representation.shape[0]:
                distances = self.get_distance_matrix(representation[i:], representation)
                amount = representation.shape[0] - i
            else:
                distances = self.get_distance_matrix(representation[i:i + 1000], representation)
                amount = 1000

            distances = np.reshape(distances, (amount, -1))
            for j in range(i, i + amount):
                graph[j] = [(idx, distances[j - i, idx]) for idx in
                            np.reshape(np.where(distances[j - i, :] <= delta), (-1))]
                neighbors[j] = [points[idx] for idx in np.reshape(np.where(distances[j - i, :] <= delta), (-1))]
                neighbors[j].append(outliers[j])
                model.add_constr(xsum(neighbors[j]) >= 1, "coverage+outliers")

        model.__data = points, outliers
        model.emphasis = 1
        model.threads = -1
        # model.max_seconds = self.max_seconds

        return model, graph

    def mip_model_subsample(self, data, subsample_num, budget, dist, delta, outlier_count, greedy_indices=None):

        model = mip.Model("Core Set Selection")

        # calculate neighborhoods:
        data_1, data_2 = np.where(dist <= delta)

        feasible_start = {}
        # set up the variables:
        points = {}
        outliers = {}
        for i in range(data.shape[0]):
            if i >= subsample_num:
                points[i] = model.add_var(ub=1.0, lb=1.0, var_type=BINARY, name="points_{}".format(i))
            else:
                points[i] = model.add_var(var_type=BINARY, name="points_{}".format(i))
        for i in range(data.shape[0]):
            name = "outliers_{}".format(i)
            outliers[i] = model.add_var(var_type=BINARY, name=name)
            # outliers[i].start = 0
            # feasible_start[name] = 0
        # initialize the solution to be the greedy solution:
        if greedy_indices is not None:
            for i in greedy_indices:
                # points[i].start = 1.0
                feasible_start[points[i].name] = 1

        # set up the constraints:
        model.add_constr(xsum(points[i] for i in range(data.shape[0])) == budget, "budget")

        neighbors = {}
        for i in range(data.shape[0]):
            neighbors[i] = []
            neighbors[i].append(outliers[i])
        for i in range(len(data_1)):
            neighbors[data_1[i]].append(points[data_2[i]])
        for i in range(data.shape[0]):
            model.add_constr(xsum(neighbors[i]) >= 1, "coverage+outliers")
        model.add_constr(xsum(outliers[i] for i in outliers) <= outlier_count, "budget")
        model.objective = xsum(outliers[i] for i in outliers)

        model.__data = points, outliers
        model.emphasis = 1
        # model.max_seconds = self.max_seconds
        return model

    def query_regular(self, X_train, labeled_idx, amount, representation):

        unlabeled_idx = get_unlabeled_idx(X_train, labeled_idx)

        # use the learned representation for the k-greedy-center algorithm
        print("Calculating Greedy K-Center Solution...")
        new_indices, max_delta = self.greedy_k_center(representation[labeled_idx], representation[unlabeled_idx],
                                                      amount)
        new_indices = unlabeled_idx[new_indices]
        if self.greedy:
            return np.array(new_indices)
        outlier_count = int(X_train.shape[0] // self.robustness_percentage)

        # iteratively solve the MIP optimization problem:
        eps = 0.01
        upper_bound = max_delta
        lower_bound = max_delta / 2.0
        print("Building MIP Model...")
        model, graph = self.mip_model(representation, labeled_idx, len(labeled_idx) + amount, upper_bound,
                                      outlier_count, greedy_indices=new_indices)
        # model.max_nodes = self.max_nodes
        points, outliers = self.get_points_and_outliers(model)
        model.optimize(max_seconds=self.max_seconds, max_nodes=self.max_nodes)
        indices = [i for i in graph if points[i].x == 1]
        current_delta = upper_bound
        timed_out = False

        while upper_bound - lower_bound > eps:

            # print("upper bound is {ub}, lower bound is {lb}".format(ub=upper_bound, lb=lower_bound))
            if timed_out or model.status in [mip.OptimizationStatus.INFEASIBLE,
                                             mip.OptimizationStatus.NO_SOLUTION_FOUND, mip.OptimizationStatus.LOADED]:
                # print("Optimization Failed - Infeasible!")
                if model.status == mip.OptimizationStatus.LOADED:
                    logging.warning(f"optimization stopped in loading, possibly loading was too long")
                lower_bound = max(current_delta, self.get_graph_min(representation, current_delta))
                current_delta = (upper_bound + lower_bound) / 2.0

                del model
                gc.collect()
                model, graph = self.mip_model(representation, labeled_idx, len(labeled_idx) + amount, current_delta,
                                              outlier_count, greedy_indices=indices)
                points, outliers = self.get_points_and_outliers(model)
                # model.max_nodes = self.max_nodes

            else:
                # print("Optimization Succeeded!")
                assert model.status in [mip.OptimizationStatus.FEASIBLE,
                                        mip.OptimizationStatus.OPTIMAL], f"unexpected status {model.status}"
                upper_bound = min(current_delta, self.get_graph_max(representation, current_delta))
                current_delta = (upper_bound + lower_bound) / 2.0
                indices = [i for i in graph if points[i].x == 1]

                del model
                gc.collect()
                model, graph = self.mip_model(representation, labeled_idx, len(labeled_idx) + amount, current_delta,
                                              outlier_count, greedy_indices=indices)
                points, outliers = self.get_points_and_outliers(model)
                # model.max_nodes = self.max_nodes

            if upper_bound - lower_bound > eps:
                # wrap the optimizing with a timer as the original timing sometimes fails to stop the optimizer
                # timed_out = False
                model.preprocess = 0
                thread = RaisingThread(target=model.optimize,
                                       kwargs={"max_seconds": self.max_seconds, "max_nodes": self.max_nodes},
                                       daemon=True)

                thread.start()
                # allow some buffer (1.2) for the model.optimize to close by itself in max_seconds
                thread.join(self.max_seconds * 1.2)
                timed_out = thread.is_alive()
                if timed_out:
                    thread.raise_exception()
                # model.optimize(max_seconds=self.max_seconds, max_nodes=self.max_nodes) # this should suffice, but mip ignores max_seconds sometimes)
        return np.array(indices)

    def query_subsample(self, X_train, labeled_idx, amount, representation=None):

        unlabeled_idx = get_unlabeled_idx(X_train, labeled_idx)

        subsample_num = 30000
        subsample_idx = np.random.choice(unlabeled_idx, subsample_num, replace=False)
        subsample = np.vstack((X_train[labeled_idx], X_train[subsample_idx]))
        new_labeled_idx = np.arange(len(labeled_idx))
        new_indices = self.query_regular(subsample, new_labeled_idx, amount, representation)
        return np.array(subsample_idx[new_indices - len(labeled_idx)])

    def query(self, X_train, labeled_idx, amount, representation):

        if self.subsample:
            return self.query_subsample(X_train, labeled_idx, amount, representation)
        else:
            return self.query_regular(X_train, labeled_idx, amount, representation)

    def get_points_and_outliers(self, model):
        points, outliers = model.__data
        return points, outliers
