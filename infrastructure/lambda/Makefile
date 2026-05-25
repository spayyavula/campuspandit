# infrastructure/lambda/Makefile
.PHONY: layer package deploy clean

LAYER := campuspandit-lambda-layer
REGION := ap-south-1
PROFILE := campuspandit-ci
HANDLERS := pilot_application_write feature_request_write feature_request_read engagement_signal_write vote_write

layer:
	rm -rf build/layer && mkdir -p build/layer/python
	pip install -r requirements.txt -t build/layer/python
	cd build/layer && zip -r ../layer.zip python
	aws lambda publish-layer-version \
		--layer-name $(LAYER) \
		--zip-file fileb://build/layer.zip \
		--compatible-runtimes python3.12 \
		--compatible-architectures x86_64 \
		--region $(REGION) --profile $(PROFILE)

package:
	rm -rf build/handlers && mkdir -p build/handlers
	for h in $(HANDLERS); do \
		cd build/handlers && mkdir -p $$h && cd $$h && \
		cp ../../../$$h.py index.py && \
		cp -r ../../../shared shared && \
		zip -r ../$$h.zip . && cd ../../..; \
	done

deploy: package
	for h in $(HANDLERS); do \
		FN=$$(echo $$h | tr _ -); \
		aws lambda update-function-code \
			--function-name $$FN \
			--zip-file fileb://build/handlers/$$h.zip \
			--region $(REGION) --profile $(PROFILE); \
	done

clean:
	rm -rf build
