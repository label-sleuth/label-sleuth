# sleuth_ui_backend
https://aichallenges.sl.cloud9.ibm.com/challenges/2501?tab=details
## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.
### Prerequisites
1. Clone the project
```
git clone git@github.ibm.com:Debater/sleuth_ui_backend.git
```
2. Create an Anaconda environment and install the requirement files
```
cd sleuth_ui_backend
conda create --name sleuth_ui_backend python=3.7
conda activate sleuth_ui_backend
pip install -r requirements.txt
```

2. copy datasets you want to use in your backend into ``data/data_access_dumps`` (the full list is here: https://github.ibm.com/Debater/sleuth_data/tree/master/data_access_dumps so if you already checkout you can copy with rsync, or you can clone the repository and copy the folder you need)
```
example: rsync -av -e ssh XXX@ace22.haifa.ibm.com:/data/ace/team/.../cfpb_complaints_issue_train data/data_access_dumps/
```

## Known Issues
1. (Mac) if you get `ERROR: Could not build wheels for tokenizers which use PEP 517 and cannot be installed directly` when running `pip install -r requirements.txt` 
run 
`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` and then `source $HOME/.cargo/env` and rerun `pip install -r requirements.txt`



## Deployment
TBD
## Built With
* [Anaconda](https://www.anaconda.com/) - Anaconda
## Authors
## License
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | shcurl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
