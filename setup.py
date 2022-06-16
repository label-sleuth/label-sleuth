import setuptools
import os


def package_files(prefix, directory):
    paths = []
    for (path, directories, filenames) in os.walk(os.path.join(prefix, directory)):
        for filename in filenames:
            paths.append(os.path.join(path, filename)[len(prefix)+1:])
    return paths


build_files = package_files("label_sleuth", "build")

requirements_file = 'label_sleuth/requirements.txt'

# read requirements from file
with open(requirements_file) as fh:
    requirements = fh.read().splitlines()

with open("README.md", "r") as fh:
    long_description = fh.read()


setuptools.setup(
    name="label-sleuth",
    version="0.1.0",
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
    package_data={"": ["../LICENSE", "config.json"] + build_files},
    include_package_data=True
)
