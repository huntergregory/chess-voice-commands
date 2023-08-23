This document outlines data and privacy practices for the Chrome extension called 'Speak to Chess.com (Standard Notation)' (the Extension). The Extension is the same extension as is defined by the code in this GitHub repo (the Repo).

## Source Code
The Extension is strictly defined by the source code from the Repo. This source code is uploaded to the Chrome Web Store Developer Dashboard, where the Extension is published. The Extension will never use source code that is not publicly shown on the Repo.

## Data Usage
The Extension uses Chrome's webkitSpeechRecognition toolkit (the Toolkit) to record speech and convert it to text. The Extension does not store or use any speech recording or personal data other than 1) as necessary to execute the app and 2) as defined by the Toolkit.

The extension gets text results from the Toolkit. Then, the Extension converts the text to a post-processed version of the text (e.g. "night D 4" is converted to "Knight d4"). Then, the Extension displays the post-processed version of the text on the website. After displaying such text, the Extension does not have any knowledge about the recording/text.
