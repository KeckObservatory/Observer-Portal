SYSNAM   = adelagarza/observers/observer-portal
VERNUM   = $(shell basename `pwd`)
BUILDDIR = dist
RELDIR   = /www/sandbox/$(SYSNAM)/$(VERNUM)

install:
	mkdir -p $(RELDIR)
	@echo "rsync -abvhHS --recursive $(BUILDDIR)/ /$(RELDIR)/"
	rsync -abvhHS --recursive $(BUILDDIR)/ /$(RELDIR)/
	cd $(RELDIR)/..; rm rel; ln -s $(VERNUM) rel;
