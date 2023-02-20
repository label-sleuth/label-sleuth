[![version](https://img.shields.io/pypi/v/label-sleuth)](https://pypi.org/project/label-sleuth/)  ![license](https://img.shields.io/github/license/label-sleuth/label-sleuth)  ![python](https://img.shields.io/badge/python-3.8%20|%203.9-blue)  ![python test](https://img.shields.io/github/actions/workflow/status/label-sleuth/label-sleuth/test_python.yml?branch=main&label=python%20tests)  ![react test](https://img.shields.io/github/actions/workflow/status/label-sleuth/label-sleuth/verify_react.yml?branch=main&label=react%20tests)  [![Slack](https://img.shields.io/badge/Slack-darkblue?logo=slack&logoColor=white)](https://join.slack.com/t/labelsleuth/shared_invite/zt-1j5tpz1jl-W~UaNEKmK0RtzK~lI3Wkxg)
# Label Sleuth

[Label Sleuth](https://ibm.biz/label-sleuth) is an open source no-code system for text annotation and building text classifers. With Label Sleuth, domain experts (e.g., physicians, lawyers, psychologists) can quickly create custom NLP models by themselves, with no dependency on NLP experts.

Creating real-world NLP models typically requires a combination of two expertise - deep knowledge of the target domain, provided by domain experts, and machine learning knowledge, provided by NLP experts. Thus, domain experts are dependent on NLP experts. Label Sleuth comes to eliminate this dependency. With an intuitive UX, it escorts domain experts in the process of labeling the data and building NLP models which are tailored to their specific needs. As domain experts label examples within the system, machine learning models are being automatically trained in the background, make predictions on new examples, and provide suggestions for the users on the examples they should label next.

Label Sleuth is a no-code system, no knowledge in machine learning is need, and - it is fast to obtain a model – from task definition to a working model in just a few hours!


<!-- As users label textual examples within the system, machine learning models train in the background, make predictions on new examples, and provide suggestions for the user on the examples they should label next.
This interactive system enables users to efficiently collect data for varied tasks and to easily build text classification models, all without requiring any machine learning expertise. -->


**Table of contents**

[Installation for end users](#installation-for-end-users-non-developers)

[Setting up a development environment](#setting-up-a-development-environment)

[Project structure](#project-structure)

[Using the system](#using-the-system)

[Customizing the system](#customizing-the-system)
* [System configuration](#system-configuration)
* [Implementing new components](#implementing-new-components)

[Reference](#reference)


## Installation for end users (non-developers)
Follow [the instructions on our website](https://www.label-sleuth.org/docs/installation.html).

## Setting up a development environment
The system requires Python 3.8 or 3.9 (other versions are currently not supported and may cause issues).
1. Clone the repository: 

   `git clone git@github.com:label-sleuth/label-sleuth.git`
2. cd to the cloned directory: `cd label-sleuth`
3. Install the project dependencies using `conda` (recommended) or `pip`:
<details><summary><b>Installing with <tt>conda</tt></b></summary>
<p>

- Install Anaconda https://docs.anaconda.com/anaconda/install/index.html

- Restart your console

- Use the following commands to create a new anaconda environment and install the requirements:
```bash
# Create and activate a virtual environment:
conda create --yes -n label-sleuth python=3.9
conda activate label-sleuth
# Install requirements
pip install -r requirements.txt
```
</p>
</details>
<details><summary><b>Installing with <tt>pip</tt></b></summary>
<p>
Assuming python 3.8/3.9 is already installed.

- Install pip https://pip.pypa.io/en/stable/installation/

- Restart your console

- Install requirements:
```bash
pip install -r requirements.txt
```
</p>
</details>

4. Start the Label Sleuth server: run `python -m label_sleuth.start_label_sleuth`.
   
   By default all project files are written to `<home_directory>/label-sleuth`, to change the directory add `--output_path <your_output_path>`.
   
   You can add `--load_sample_corpus wiki_animals_2000_pages` to load a sample corpus into the system at startup. This fetches a collection of Wikipedia documents from the [data-examples repository](https://github.com/label-sleuth/data-examples).
   
   By default, the host will be `localhost` to expose the server only on the host machine. If you wish to expose the server to external communication, add `--host <IP>` for example, `--host 0.0.0.0` to listen to all IPs.
   
   Default port is 8000, to change the port add `--port <port_number>` to the command.

   The system can then be accessed by browsing to http://localhost:8000 (or http://localhost:<port_number>)

## Project Structure
The repository consists of a backend library, written in Python, and a frontend that uses React. A compiled version of the frontend can be found under `label_sleuth/build`.

## Using the system

See our website for a [simple tutorial](https://www.label-sleuth.org/docs/tutorial.html) that illustrates how to use the system with a sample dataset of Wikipedia pages. Before starting the tutorial, make sure you pre-load the sample dataset by running:

`python -m label_sleuth.start_label_sleuth --load_sample_corpus wiki_animals_2000_pages`.

## Customizing the system

### System configuration
The configurable parameters of the system are specified in a json file. The default configuration file is [label_sleuth/config.json](label_sleuth/config.json).

A custom configuration can be applied by passing the `--config_path` parameter to the "start_label_sleuth" command, e.g., `python -m label_sleuth.start_label_sleuth --config_path <path_to_my_configuration_json>`

Alternatively, it is possible to override specific configuration parameters at startup by adding them to the run command, e.g., `python -m label_sleuth.start_label_sleuth --changed_element_threshold 100`

**Configurable parameters:**

| Parameter                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `first_model_positive_threshold`  | Number of elements that must be assigned a positive label for the category in order to trigger the training of a classification model. <br /> <br /> _See also:_ The [training invocation](https://www.label-sleuth.org/docs/dev/model_training.html#training-invocation) documentation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `changed_element_threshold`       | Number of changes in user labels for the category -- relative to the last trained model -- that are required to trigger the training of a new model. A change can be a assigning a label (positive or negative) to an element, or changing an existing label. Note that `first_model_positive_threshold` must also be met for the training to be triggered. <br /> <br /> _See also:_ The [training invocation](https://www.label-sleuth.org/docs/dev/model_training.html#training-invocation) documentation.                                                                                                                                                                                                                                                                                                                                                                                                        |
| `training_set_selection_strategy` | Strategy to be used from [TrainingSetSelectionStrategy](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/training_set_selector/train_set_selector_api.py#L24). A TrainingSetSelectionStrategy determines which examples will be sent in practice to the classification models at training time - these will not necessarily be identical to the set of elements labeled by the user. For currently supported implementations see [get_training_set_selector()](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/training_set_selector/training_set_selector_factory.py). <br /> <br /> _See also:_ The [training set selection](https://www.label-sleuth.org/docs/dev/model_training.html#training-set-selection) documentation.                                                                     |
| `model_policy`                    | Policy to be used from [ModelPolicies](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/models/core/model_policies.py). A [ModelPolicy](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/models/policy/model_policy.py#L21) determines which type of classification model(s) will be used, and _when_ (e.g. always / only after a specific number of iterations / etc.). <br /> <br /> _See also:_ The [model selection](https://www.label-sleuth.org/docs/dev/model_training.html#model-selection) documentation.                                                                                                                                                                                                                                                                                   |
| `active_learning_strategy`        | Strategy to be used from [ActiveLearningCatalog](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/active_learning/core/catalog.py#L22). An [ActiveLearner](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/active_learning/core/active_learning_api.py#L26) module implements the strategy for recommending the next elements to be labeled by the user, aiming to increase the efficiency of the annotation process. For currently supported implementations see the [ActiveLearningCatalog](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/active_learning/core/catalog.py#L22). <br /> <br /> _See also:_ The [active learning](https://www.label-sleuth.org/docs/dev/active_learning.html) documentation. |
| `precision_evaluation_size`       | Sample size to be used for estimating the precision of the current model. To be used in future versions of the system, which will provide built-in evaluation capabilities.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `apply_labels_to_duplicate_texts` | Specifies how to treat elements with identical texts. If `true`, assigning a label to an element will also assign the same label to other elements which share the exact same text; if `false`, the label will only be assigned to the specific element labeled by the user.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `language`                        | Specifies the chosen system-wide language. This determines some language-specific resources that will be used by models and helper functions (e.g., stop words). The list of supported languages can be found in [Languages](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/models/core/languages.py). We welcome contributions of additional languages.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `login_required`                  | Specifies whether or not using the system will require user authentication. If `true`, the configuration file must also include a `users` parameter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `users`                           | Only relevant if `login_required` is `true`. Specifies the pre-defined login information in the following format: <pre>"users":[<br>&nbsp;{<br>&nbsp;&nbsp;&nbsp;"username": "<predefined_username1>",<br>&nbsp;&nbsp;&nbsp;"token":"<randomly_generated_token1>",<br>&nbsp;&nbsp;&nbsp;"password":"<predefined_user1_password>"<br>&nbsp;}<br>] </pre> * The list of usernames is static and currently all users have access to all the workspaces in the system.                                                                                                                                                                                                                                                                                                                                                                                                           |



### Implementing new components
Label Sleuth is a modular system. We welcome the contribution of additional implementations for the various modules, aiming to support a wider range of user needs and to harness efficient and innovative machine learning algorithms.

Below are instructions for implementing new models and active learning strategies:

<details><summary><b>Implementing a new machine learning model</b></summary>

   These are the steps for integrating a new classification model:
   1. Implement a new `ModelAPI`
   
   Machine learning models are integrated by adding a new implementation of the ModelAPI.
   
   The main functions are *_train()*, *load_model()* and *infer()*:
   
   ```python
   def _train(self, model_id: str, train_data: Sequence[Mapping], model_params: Mapping):
   ```
   - model_id     
   - train_data - a list of dictionaries with at least the "text" and "label" fields. Additional fields can be passed e.g.
   *[{'text': 'text1', 'label': 1, 'additional_field': 'value1'}, {'text': 'text2', 'label': 0, 'additional_field': 'value2'}]*
   - model_params - dictionary for additional model parameters (can be None)

   ```python   
   def load_model(self, model_path: str):
   ```
   - model_path: path to a directory containing all model components
   
   Returns an object that contains all the components that are necessary to perform inference (e.g., the trained model itself, the language recognized by the model, a trained vectorizer/tokenizer etc.).

   ```python
   def infer(self, model_components, items_to_infer) -> Sequence[Prediction]:
   ```
   - model_components: the return value of `load_model()`, i.e. an object containing all the components that are necessary to perform inference
   - items_to_infer: a list of dictionaries with at least the "text" field. Additional fields can be passed,
   e.g. *[{'text': 'text1', 'additional_field': 'value1'}, {'text': 'text2', 'additional_field': 'value2'}]*
   
   Returns a list of [Prediction](https://github.com/label-sleuth/label-sleuth/blob/main/label_sleuth/models/core/prediction.py#L20) objects - one for each item in *items_to_infer* - where 
    Prediction.label is a boolean and Prediction.score is a float in the range [0-1].
    Additional outputs can be passed by inheriting from the base Prediction class and overriding the get_predictions_class() method.
   
   2. Add the newly implemented ModelAPI to `ModelsCatalog`
   
   3. Add one or more policies that use the new model to `ModelPolicies`
   
</details>

<details>
   <summary><b>Implementing a new active learning strategy</tt></b></summary>
<p>
These are the steps for integrating a new active learning approach:

   1. Implement a new `ActiveLearner`
   
   Active learning modules are integrated by adding a new implementation of the ActiveLearner API.
   The function to implement is *get_per_element_score*:
   ```python
    def get_per_element_score(self, candidate_text_elements: Sequence[TextElement],
                              candidate_text_element_predictions: Sequence[Prediction], workspace_id: str,
                              dataset_name: str, category_name: str) -> Sequence[float]:    
   ```    
   Given sequences of text elements and the model predictions for these elements, this function returns an active learning score for each element.
   The elements with the highest scores will be recommended for the user to label next.
   
   2. Add the newly implemented ActiveLearner to the `ActiveLearningCatalog`
   </p>
   </details>

## Reference
Eyal Shnarch, Alon Halfon, Ariel Gera, Marina Danilevsky, Yannis Katsis, Leshem Choshen, Martin Santillan Cooper, Dina Epelboim, Zheng Zhang, Dakuo Wang, Lucy Yip, Liat Ein-Dor, Lena Dankin, Ilya Shnayderman, Ranit Aharonov, Yunyao Li, Naftali Liberman, Philip Levin Slesarev, Gwilym Newton, Shila Ofek-Koifman, Noam Slonim and Yoav Katz (EMNLP 2022). [Label Sleuth: From Unlabeled Text to a Classifier in a Few Hours](https://aclanthology.org/2022.emnlp-demos.16).

Please cite:
```
@inproceedings{shnarch2022labelsleuth,
	title={{L}abel {S}leuth: From Unlabeled Text to a Classifier in a Few Hours},
	author={Shnarch, Eyal and Halfon, Alon and Gera, Ariel and Danilevsky, Marina and Katsis, Yannis and Choshen, Leshem and Cooper, Martin Santillan and Epelboim, Dina and Zhang, Zheng and Wang, Dakuo and Yip, Lucy and Ein-Dor, Liat and Dankin, Lena and Shnayderman, Ilya and Aharonov, Ranit and Li, Yunyao and Liberman, Naftali and Slesarev, Philip Levin and Newton, Gwilym and Ofek-Koifman, Shila and Slonim, Noam and Katz, Yoav},
	booktitle={Proceedings of the 2022 Conference on Empirical Methods in Natural Language Processing ({EMNLP}): System Demonstrations},
    	month={dec},
    	year={2022},
    	address={Abu Dhabi, UAE},
	publisher={Association for Computational Linguistics},
	url={https://aclanthology.org/2022.emnlp-demos.16},
    	pages={159--168}
}
```
