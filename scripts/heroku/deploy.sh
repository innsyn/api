# Copyright 2019 Schibsted
#!/bin/bash

heroku container:login
heroku container:push web --app innsyn
heroku container:release web --app innsyn
