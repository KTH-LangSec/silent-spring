# Silent Spring: Prototype Pollution Leads to RCE in Node.js
<p><a href="https://github.com/yuske/silent-spring/blob/master/silent-spring-full-version.pdf"><img alt="Silent Spring Paper Thumbnail" align="left" width="340" src="https://github.com/yuske/silent-spring/assets/2105787/f4a67155-42ff-4ed8-b87d-d2edf89a2ec8"></a></p>

Prototype pollution is a dangerous vulnerability affecting prototype-based languages like JavaScript and the Node.js platform. It refers to the ability of an attacker to inject properties into an object's root prototype at runtime and subsequently trigger the execution of legitimate code gadgets that access these properties on the object's prototype, leading to attacks such as Denial of Service (DoS), privilege escalation, and Remote Code Execution (RCE). While there is anecdotal evidence that prototype pollution leads to RCE, current research does not tackle the challenge of gadget detection, thus only showing feasibility of DoS attacks, mainly against Node.js libraries.

In this paper, we set out to study the problem in a holistic way, from the detection of prototype pollution to detection of gadgets, with the ambitious goal of finding end-to-end exploits beyond DoS, in full-fledged Node.js applications. We build the first multi-staged framework that uses multi-label static taint analysis to identify prototype pollution in Node.js libraries and applications, as well as a hybrid approach to detect universal gadgets, notably, by analyzing the Node.js source code. We implement our framework on top of GitHub's static analysis framework CodeQL to find 11 universal gadgets in core Node.js APIs, leading to code execution. Furthermore, we use our methodology in a study of 15 popular Node.js applications to identify prototype pollutions and gadgets. We manually exploit eight RCE vulnerabilities in three high-profile applications such as NPM CLI, Parse Server, and Rocket.Chat. Our results provide alarming evidence that prototype pollution in combination with powerful universal gadgets lead to RCE in Node.js.
For more details, check out [the full paper](/silent-spring-full-version.pdf) and presentations below.

Our research was awarded [the third prize](https://twitter.com/CsawEurope/status/1726984259678933421) 🥉 in the Applied Research Competition at [CSAW'23 Europe](https://www.csaw.io/europe).

## Presentations
<p><a href="http://www.youtube.com/watch?feature=player_embedded&v=OapJhT0TDgE" target="_blank">
 <img src="http://img.youtube.com/vi/OapJhT0TDgE/mqdefault.jpg" alt="USENIX Security'23" border="10" align="left"/>
</a></p>

The paper was presented at the [32nd USENIX Security Symposium (USENIX Security'23)](https://www.usenix.org/conference/usenixsecurity23/presentation/shcherbakov). You can watch a short 12-minute video and check out [the slides](https://www.usenix.org/system/files/sec23_slides_scherbakov-mikhail.pdf) for a brief introduction to our contribution.
<br/><br/><br/><br/><br/>

<p><a href="http://www.youtube.com/watch?feature=player_embedded&v=gCVTbfDecwI" target="_blank">
 <img src="http://img.youtube.com/vi/gCVTbfDecwI/mqdefault.jpg" alt="Watch the video" border="10"  align="left"/>
</a></p>

We also presented an extended version (20 minutes) of the talk at [DEF CON 31](https://forum.defcon.org/node/246117). You can watch the video and view the slides for more in-depth information.
<br/><br/><br/><br/><br/><br/>

<p><a href="http://www.youtube.com/watch?feature=player_embedded&v=v5dq80S1WF4" target="_blank">
 <img src="http://img.youtube.com/vi/v5dq80S1WF4/mqdefault.jpg" alt="Watch the video" border="10"  align="left"/>
</a></p>

Additionally, the Black Hat talk ["Prototype Pollution Leads to RCE: Gadgets Everywhere"](https://www.blackhat.com/asia-23/briefings/schedule/#prototype-pollution-leads-to-rce-gadgets-everywhere-31065) is based on our research. This presentation focuses on the technical details of the detected gadgets and RCE exploits. Enjoy the 40-minute video and review [the accompanying slides](http://i.blackhat.com/Asia-23/AS-23-Shcherbakov-Prototype-Pollution-Leads-to-RCE.pdf).
<br/><br/><br/><br/><br/>


## Academic Publication
The artifact describes the experiments from the paper ["Silent Spring: Prototype Pollution Leads to Remote Code Execution in Node.js"](/silent-spring-full-version.pdf). If you use the paper and/or the experiments results for academic research, we encourage you to cite it as:

```
@inproceedings{SilentSpring2023,
  title = {{Silent Spring: Prototype Pollution Leads to Remote Code Execution in Node.js}},
  author={Shcherbakov, Mikhail and Balliu, Musard and Staicu, Cristian-Alexandru},
  booktitle = {32nd {USENIX} Security Symposium ({USENIX} Security 23)},
  year = {2023}
}
```

```
@inproceedings{SilentSpringArtifact2023,
  title = {{USENIX'23 Artifact Appendix: Silent Spring: Prototype Pollution Leads to Remote Code Execution in Node.js}},
  author={Shcherbakov, Mikhail and Balliu, Musard and Staicu, Cristian-Alexandru},
  booktitle = {32nd {USENIX} Security Symposium ({USENIX} Security 23)},
  year = {2023}
}
```

## Artifact
The artifact implements static code analysis for detecting prototype pollution vulnerabilities and gadgets in server-side JavaScript libraries and applications, including the Node.js source code. The analysis builds on GitHub's CodeQL framework to identify prototype pollution sinks and gadgets. We evaluate precision and recall metrics for prototype pollution detection in comparison with existing CodeQL analysis as well as the tool ODGen. Further, we evaluate the capabilities of our tool, in combination with dynamic analysis, to detect gadgets in a range of popular applications, including the Node.js source code. Finally, we evaluate the prevalence of detected gadgets on a dataset of popular libraries.

### Requirements
#### Hardware
We perform the experiments on an Intel Core i7-8850H CPU 2.60GHz, 16 GB RAM, and 50 GB of disk space. No specific hardware features are required. 

#### Software
We originally run our experiments (except for ODGen evaluation) on Windows OS and presented these results in the paper. However, CodeQL and our evaluation scripts support Linux and provide similar results.

### Setup
We provide two modes for experiments evaluation (1) a docker image with the prepared environment and (2) detailed instructions on how to set up the environment on own machine.

#### Docker container
To use the docker image, pull the docker image `yu5k3/silent-spring-experiments` from Docker Hub, launch a docker container, and run `bash` into the container to get access to the pre-configured environment.
```
docker pull yu5k3/silent-spring-experiments:latest
docker run -dit --name silent-spring-experiments yu5k3/silent-spring-experiments:latest
docker exec -it silent-spring-experiments /bin/bash
```

#### Local installation
- Install Node.js v.16.13.1.
- Install Cloc. We use `cloc` application to count lines of analyzed code. Use https://github.com/AlDanial/cloc to download and install the latest version.
- Install CodeQL v.2.9.2. Download and unzip an asset for your platform of the version 2.9.2 from https://github.com/github/codeql-cli-binaries/releases/tag/v2.9.2. Add the path of the `codeql` folder to `PATH` environment variable.
- Clone the ODGen repository https://github.com/Song-Li/ODGen.git and checkout commit `306f6f2`. Follow its README file to set up the tool.
- Clone the Silent Spring repository with its submodules: `git clone --recurse-submodules https://github.com/yuske/silent-spring.git`
- Move to the scripts by `cd silent-spring/scripts/`. Further, it is important to run any setup and evaluation scripts using the `scripts` as a working directory.
- Run the script `./benchmark-silent-spring.install-dependencies.sh` to install dependencies.
- Install NPM dependencies for the scripts by `npm i`.

### Basic Test
We recommend a basic test for 1-2 NPM packages with our CodeQL queries to check that all required components function correctly. The execution of command `node ./benchmark-silent-spring.codeql.js -l 1` from directory `scripts` performs the analysis of only one NPM package from `benchmark-silent-spring` and stores the results at `../raw-data/benchmark-silent-spring.codeql.limit.md`. The analysis should be completed in about 3 minutes. We provide a reference file for comparison with the basic test results. The easiest way to compare the evaluation results with the reference is to execute `git diff -- ../raw-data/benchmark-silent-spring.codeql.limit.md`. The count of detected cases in the table should be the same.

### Benchmarks
We provide five benchmarks for our experiments. The root directory of the repository contains folders with benchmark names from the list below.

| Directory               | Description |
|-------------------------|-------------|
| benchmark-silent-spring | We compile an open-source dataset of 100 vulnerable Node.js packages to evaluate the recall and precision metrics of our static analysis. |
| benchmark-odgen         | We consider the dataset of 19 packages provided by the tool ODGen to compare our static analysis approach with the state-of-the-art results of ODGen. |
| benchmark-popular-apps  | We evaluate our approach on popular Node.js applications from GitHub. The benchmark contains exact versions of 15 analyzed applications. |
| benchmark-nodejs        | We run our gadget detection analysis against Node.js version 16.13.1. The source code of the analyzed Node.js is located in a folder of the benchmark. |
| benchmark-npm-packages  | We estimate the prevalence of the gadgets in an experiment with the 10,000 most dependent-upon NPM packages. This benchmark contains these NPM packages.|


### Experiments
We provide scripts that automate the running of our experiments.

| File                                                          | Description | Execution Time |
|---------------------------------------------------------------|-------------|----------------|
| [benchmark-silent-spring.codeql.js](/scripts/benchmark-silent-spring.codeql.js) | Evaluate our analysis framework on `benchmark-silent-spring`. | 1.9 hrs |
| [benchmark-odgen.codeql.js](/scripts/benchmark-odgen.codeql.js) | Evaluate our analysis framework on `benchmark-odgen`. | 0.2 hr |
| [benchmark-silent-spring.baseline.codeql.js](/scripts/benchmark-silent-spring.baseline.codeql.js) | Evaluate the existing CodeQL analysis on `benchmark-silent-spring`. | 0.6 hr |
| [benchmark-popular-apps.codeql.js](/scripts/benchmark-popular-apps.codeql.js) | Evaluate our analysis to detect prototype pollution in Node.js applications. | <10 mins |
| [benchmark-silent-spring.odgen.js](/scripts/benchmark-silent-spring.odgen.js) | Evaluate ODGen on `benchmark-silent-spring`. | 7.6 hrs |
| [benchmark-odgen.odgen.js](/scripts/benchmark-odgen.odgen.js) | Evaluate ODGen on `benchmark-odgen`. | 3.2 hrs |
| [gadgets.infer-properties.js](/scripts/gadgets.infer-properties.js) | Report property names in [nodejs-properties.json](/raw-data/nodejs-properties.json) for further dynamic analysis. | <5 mins |
| [gadgets.dynamic-analysis.js](/scripts/gadgets.dynamic-analysis.js) | Report undefined properties subject to prototype pollution in [gadgets.dynamic-analysis.csv](/raw-data/gadgets.dynamic-analysis.csv). | 1 min |
| [gadgets.static-analysis.js](/scripts/gadgets.static-analysis.js) | Evaluate the data flow analysis for the detected properties from [gadgets.dynamic-analysis.csv](/raw-data/gadgets.dynamic-analysis.csv). | 1 min |
| [gadgets.download-packages.sh](/scripts/gadgets.download-packages.sh) | Download 10,000 most dependent-upon NPM packages in the folder `benchmark-npm-packages` for the prevalence analysis. | 40 mins |
| [gadgets.prevalence-analysis.js](/scripts/gadgets.prevalence-analysis.js) | Analyze the NPM packages to estimate potential exploitability of detected gadgets. | <5 mins |
