These are the steps for releasing a new version of the system:

* Create a new conda environment and clone the latest version of the system:

`conda create --yes -n label-sleuth python=3.9; conda activate label-sleuth; git clone git@github.com:label-sleuth/label-sleuth.git; cd label-sleuth; pip install -r requirements.txt`
* Run the tests: `python -m unittest`

For testing the system, either clear your browser cache or add `--port <PORT_NUMBER>` to the command with a different port number from what you usually use.
* Assuming you have some existing workspaces/categories in the default output directory: start the system with `python -m label_sleuth.start_label_sleuth --port <PORT_NUMBER>`, open the system, label some elements in an existing category from different views (document, Label Next etc.)
* Delete or backup the output directory (usually `~/label-sleuth`)
* Start Label Sleuth with `python -m label_sleuth.start_label_sleuth --load_sample_corpus wiki_animals_2000_pages --port <PORT_NUMBER>` to test loading the sample corpus
* Upload an additional corpus
* Create a workspace
* Create a category, label 2-3 elements.
* Use the search and label the search results to reach >20 labeled elements (continue playing with the system while waiting for a model)
* Go to "label-next", label an element, jump to a document
* Go to "positive predictions", label an element, jump to a document
* Label an additional ~20 elements to train another new model
* Download the labeled data
* Create a new workspace
* Import the downloaded model to the new workspace and make sure the same elements appear on both workspaces

*Only if all the above steps are in order*, create a new PyPi release by pushing a new version tag:
* `git tag v<VERSION_NUMBER>` (e.g., `git tag v0.0.0`)
* `git push --tags`

Within a few minutes, you should see that the new version appears in https://pypi.org/project/label-sleuth/
