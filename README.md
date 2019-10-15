# Intentalyzer

## Overview

This goal of this project is to provide a set of abstract building blocks, in the form of a pipeline, which applications can use to perform Natural Language Processing (NLP) of text utterances.

Fundamentally, the core API takes a simple text utterance as input and produces a output that includes an intent and a set of entities which can then be consumed by downstream logic. Thus, a consuming application need only invoke a simple function and is kept completely agnostic of the complexity of the pipeline from which those details were producedgit.

## Repository Contents

This is a monorepo that utilizes [Lerna](https://lerna.js.org/) to produce several packages which contain various add-on units of functionality built around the core package.

More details for each individual package are to be provided in their specific READMEs.

## Getting Started

Clone the repo and then perform the following steps in the shell to prepare to develop locally:

```shell
> npm install
> npm run build
> npm run test
```
