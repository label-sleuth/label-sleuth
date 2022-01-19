import multiprocessing.pool


# class NoDaemonProcessPool(multiprocessing.pool.Pool):
#     def Process(self, *args, **kwds):
#         proc = super(NoDaemonProcessPool, self).Process(*args, **kwds)
#
#         class NonDaemonProcess(proc.__class__):
#             """Monkey-patch process to ensure it is never daemonized"""
#
#             @property
#             def daemon(self):
#                 return False
#
#             @daemon.setter
#             def daemon(self, val):
#                 pass
#
#         proc.__class__ = NonDaemonProcess
#
#         return proc
class NoDaemonProcess(multiprocessing.Process):
    # make 'daemon' attribute always return False
    @property
    def daemon(self):
        return False

    @daemon.setter
    def daemon(self, val):
        pass


class NoDaemonProcessPool(multiprocessing.pool.Pool):

    def Process(self, *args, **kwds):
        proc = super(NoDaemonProcessPool, self).Process(*args, **kwds)
        proc.__class__ = NoDaemonProcess

        return proc
    # Process = NoDaemonProcess

    # if sys.version_info[1] < 7:
    #     pass
    # else:
    #     logging.warning
