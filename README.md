# PVR Slackbot

A slackbot that interacts with the popular SONARR and COUCHPOTATO PVR via their APIs

## Installation

Set environment variables for

 - SLACK_TOKEN - Generate a token for your Slackbot [here](https://my.slack.com/services/new/bot)
 - SONARR_PORT - The port your SONARR instance runs on
 - SONARR_HOST - The host address of your SONARR instance
 - SONARR_KEY - The API Key for accessing SONARR
 - CP_PORT - The port your CouchPotato instance runs on
 - CP_HOST - The host address of your CouchPotato instance
 - CP_KEY - The API Key for accessing CouchPotato
 
Then run

`npm start`

## Usage

This bot only responds using direct messaging.

Type `help` to get options.

Type `download tv` followed by the TV show name to initiate TV Show download conversation.

Type `download movie` followed by the Movie name to initiate Movie download conversation.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## History

v1 - Inital release


## License

The MIT License (MIT)

Copyright (c) <2016> < Ryan Siebert>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.