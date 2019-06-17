# Copyright 2019 Schibsted
#!/bin/bash

heroku container:login
heroku container:push web --recursive --app innsyn
heroku container:release web --app innsyn
