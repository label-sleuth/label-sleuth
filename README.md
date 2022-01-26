# SLEUTH Classification Framework

TBD


**Table of contents**

[Installation](#installation)

[Adapting to additional scenarios](#adapting-to-additional-scenarios):
* [Implementing a new machine learning model](#implementing-a-new-machine-learning-model)
* [Implementing a new active learning strategy](#implementing-a-new-active-learning-strategy)

## Installation
Currently, the framework requires Python 3.8
1. Clone the repository: 

   `git clone git@github.ibm.com:sleuth/sleuth_classification_service.git`
2. cd to the cloned directory `cd sleuth_classification_service`
3. Install the project dependencies using `conda` (recommended) or `pip`
<details><summary><b>Installing with <tt>conda</tt></b></summary>
<p>

- Install Anaconda https://docs.anaconda.com/anaconda/install/index.html

- Restart your console

- Use the following commands to create a new anaconda environment and install the requirements:
```bash
# Create and activate a virtual environment:
conda create --yes -n sleuth_classification python=3.8
conda activate sleuth_classification
# Install requirements
pip install -r lrtc_lib/requirements.txt
```
</p>
</details>
<details><summary><b>Installing with <tt>pip</tt></b></summary>
<p>
Assuming python 3.8 is already installed.

- Install pip https://pip.pypa.io/en/stable/installation/

- Restart your console

- Install requirements:
```bash
pip install -r lrtc_lib/requirements.txt
```
</p>
</details>

4. Start SLEUTH server `python start_service.py`

## Adapting to additional scenarios
### Implementing a new machine learning model
These are the steps for integrating a new classification model:
1. Implement a new `TrainAndInferAPI`

    Machine learning models are integrated by adding a new implementation of the TrainAndInferAPI.
    The main functions are *train* and *infer*:
    
    **Train** a new model and return a unique model identifier that will be used for inference.
    ```python    
    def train(self, train_data: Sequence[Mapping], dev_data: Sequence[Mapping], test_data: Sequence[Mapping], 
    train_params: dict) -> str
   ```
        
    - train_data - a list of dictionaries with at least the "text" and "label" fields. Additional fields can be passed e.g.
    *[{'text': 'text1', 'label': 1, 'additional_field': 'value1'}, {'text': 'text2', 'label': 0, 'additional_field': 'value2'}]*
    - dev_data: can be None if not used by the implemented model
    - test_data - can be None if not used by the implemented model
    - train_params - dictionary for additional train parameters (can be None)

    **Infer** a given sequence of elements and return the results.

    ```python    
    def infer(self, model_id, items_to_infer: Sequence[Mapping], infer_params: dict, use_cache=True) -> dict:
    ```    
    - model_id
    - items_to_infer: a list of dictionaries with at least the "text" field. Additional fields can be passed,
    e.g. *[{'text': 'text1', 'additional_field': 'value1'}, {'text': 'text2', 'additional_field': 'value2'}]*
    - infer_params: dictionary for additional inference parameters (can be None)
    - use_cache: save the inference results to cache. Default is True
    
    Returns a dictionary with at least the "labels" key, where the value is a list of numeric labels for each element in
    items_to_infer.
    Additional keys (with list values of the same length) can be passed,
    e.g. *{"labels": [1, 0], "gradients": [[0.24, -0.39, -0.66, 0.25], [0.14, 0.29, -0.26, 0.16]]}*

2. Specify a new ModelType in `ModelTypes`
3. Return the newly implemented TrainAndInferAPI in `TrainAndInferFactory`
4. The system assumes that active learning strategies that require special inference outputs (e.g. text embeddings)
are not supported by your new model. If your model does support this, add it to the appropriate category 
in `get_compatible_models` in `strategies.py`
5. Set your ModelType in one of the ExperimentRunners, and run

### Implementing a new active learning strategy
These are the steps for integrating a new active learning approach:
1. Implement a new `ActiveLearner`
   
   Active learning modules inherit from the ActiveLearner API.
   The main function to implement is *get_recommended_items_for_labeling*:
   ```python
   def get_recommended_items_for_labeling(self, workspace_id: str, model_id: str, dataset_name: str,
                                           category_name: str, sample_size: int = 1) -> Sequence[TextElement]:
    
   ```    
   This function returns a batch of *sample_size* elements suggested by the active learning module for a given dataset
   and category, based on the outputs of model *model_id*.
   
   Optionally, the ActiveLearner can also implement the function `get_per_element_score`, where the active learning 
   module does not just return a batch of selected elements, but can also assign each text element with a score.

2. Specify a new ActiveLearningStrategy in `ActiveLearningStrategies`
3. Return your new ActiveLearner in `ActiveLearningFactory`
4. If the active learner requires particular outputs from the machine learning model, update `get_compatible_models` 
accordingly. For instance, if the strategy relies on model embeddings, add it to the set of embedding-based strategies.
5. Set your ActiveLearningStrategy in one of the ExperimentRunners, and run

### Classification models
- **ModelTypes.NB_OVER_BOW**: a Naive Bayes implementation from [scikit-learn](https://scikit-learn.org) over Bag-of-words representations
- **ModelTypes.NB_OVER_GLOVE**: a Naive Bayes implementation over GloVe representations
- **ModelTypes.SVM_OVER_BOW**: a Support Vector Machine implementation from [scikit-learn](https://scikit-learn.org) over Bag-of-words representations
- **ModelTypes.SVM_OVER_GLOVE**: a Support Vector Machine implementation over GloVe representations
- **ModelTypes.SVM_ENSEMBLE**: an ensemble of the SVM_OVER_BOW and SVM_OVER_GLOVE models
- **ModelTypes.HF_BERT**: A pytorch implementation of BERT (Devlin et al. 2018) that uses the [huggingface Transformers](https://github.com/huggingface/transformers) library 

### Active learning strategies
- **RANDOM**: AL baseline, randomly sample from unlabeled data.
- **RETROSPECTIVE**: select the top scored instances by the model.
- **HARD_MINING**: a.k.a uncertainty sampling / least confidence; Lewis and Gale 1994
- **GREEDY_CORE_SET**: the greedy method from Sener and Savarese 2017
- **DAL**: Discriminative representation sampling; Gissin and Shalev-Shwartz 2019
- **PERCEPTRON_ENSEMBLE**: lightweight ensemble version of uncertainty sampling; uncertainty is determined
using an ensemble of perceptrons, which were trained over output embeddings from the original model.
- **DROPOUT_PERCEPTRON**: similar to the above, but instead of an ensemble of perceptrons, uses a single perceptron
with Monte Carlo dropout (Gal and Ghahramani, 2016)

