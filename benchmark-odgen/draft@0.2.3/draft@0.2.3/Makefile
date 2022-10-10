
BUILD = ./build/build.js
DIST_DIR = ./dist
DIST_FILE = $(DIST_DIR)/draft.js
DIST_HEADER = ./dist.wrapper.header.js
DIST_FOOTER = ./dist.wrapper.footer.js
OUTPUT_FILE = ./draft.js


all: clean install test build

build: install
	@component build --dev

components: component.json
	@component install --dev

clean:
	@rm -rf ./node_modules
	@rm -rf build components template.js

install:
	@npm install .
	@component install 

test:
	@# we need to use a local mocha 
	@./node_modules/mocha/bin/mocha -R spec

dist: build
	@# if the distribution directory exists then remove it
	@test -d $(DIST_DIR) && rm -rf $(DIST_DIR)
	@# create a fresh distribution directory
	@mkdir $(DIST_DIR)
	@# ensure distribution copy exists
	@touch $(DIST_FILE)
	@# append header to distribution file
	@cat $(DIST_HEADER) >> $(DIST_FILE)
	@# append build to distribution file
	@cat $(BUILD) >> $(DIST_FILE)
	@# append footer to distribution file
	@cat $(DIST_FOOTER) >> $(DIST_FILE)
	@# copy contents of distribution file to
	@# the public output file
	@cp $(DIST_FILE) $(OUTPUT_FILE)

.PHONY: all clean install test components build dist