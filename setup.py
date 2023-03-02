#
#  Copyright (c) 2022 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

import setuptools
import os

import git  # for RELEASE_VERSION
RELEASE_VERSION = git.repo.Repo(".").git.describe(tags=True)()['version'].rslist('-', 2)[0]

def package_files(prefix, directory):
    paths = []
    for (path, directories, filenames) in os.walk(os.path.join(prefix, directory)):
        for filename in filenames:
            paths.append(os.path.join(path, filename)[len(prefix)+1:])
    return paths


build_files = package_files("label_sleuth", "build")

requirements_file = 'requirements.txt'

# read requirements from file
with open(requirements_file) as fh:
    requirements = fh.read().splitlines()

with open("README.md", "r") as fh:
    long_description = fh.read()


setuptools.setup(
    name="label-sleuth",
    version=f"{RELEASE_VERSION}".replace('v', ''),
    author="IBM Research",
    author_email="eyals@il.ibm.com",
    url="https://github.com/label-sleuth/label-sleuth",
    description="Label Sleuth",
    long_description=long_description,
    long_description_content_type="text/markdown",
    install_requires=requirements,
    packages=setuptools.find_packages(),
    license='Apache License 2.0',
    python_requires='>=3.8',
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Topic :: Scientific/Engineering",
    ],
    package_data={"": ["LICENSE", "config.json", "requirements.txt"] + build_files},
    include_package_data=True
)
