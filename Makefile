SERVICE := faustvault
DESTDIR ?= dist_root
SERVICEDIR ?= /srv/$(SERVICE)

.PHONY: build install clean dev wasm-crypt rsa test

build:
	echo nothing to build

install: build
	mkdir -p $(DESTDIR)$(SERVICEDIR)
	# Remove build-only frontend-build and faustvault_deps container
	yq -y 'del(.services."frontend-wasmpack") | del(.services."frontend-build-deps") | del(.services."faustvault_deps") | del(.services."frontend-nodemodules")' docker-compose.yml > $(DESTDIR)$(SERVICEDIR)/docker-compose.yml
	cp -r faustvault $(DESTDIR)$(SERVICEDIR)
	cp -r frontend $(DESTDIR)$(SERVICEDIR)
	rm -r -f $(DESTDIR)$(SERVICEDIR)/frontend/rsa
	rm -r -f $(DESTDIR)$(SERVICEDIR)/frontend/node_modules
	rm -r -f $(DESTDIR)$(SERVICEDIR)/frontend/wasm-crypt/target
	cp -r database $(DESTDIR)$(SERVICEDIR)
	cp -r nginx $(DESTDIR)$(SERVICEDIR)
	mkdir -p $(DESTDIR)/etc/systemd/system/faustctf.target.wants/
	ln -s /etc/systemd/system/docker-compose@.service $(DESTDIR)/etc/systemd/system/faustctf.target.wants/docker-compose@$(SERVICE).service

clean:
	rm -rf dist_root
