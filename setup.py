import setuptools

resources_dir = "../frontend/build"

requirements_file = 'label_sleuth/requirements.txt'

# read requirements from file
with open(requirements_file) as fh:
    requirements = fh.read().splitlines()

with open("README.md", "r") as fh:
    long_description = fh.read()


setuptools.setup(
    name="label-sleuth",
    version="RELEASE_VERSION".replace('v', ''),
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
    package_data={"": ["../LICENSE",
                       "config.json"
                       f"{resources_dir}/*.css",
                       f"{resources_dir}/*.js",
                       f"{resources_dir}/*.png",
                       f"{resources_dir}/*.svg", ]},
    include_package_data=True
)
