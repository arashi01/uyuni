%if ! (0%{?fedora} || 0%{?rhel} > 5)
%{!?python_sitelib: %define python_sitelib %(%{__python} -c "from distutils.sysconfig import get_python_lib; print get_python_lib()")}
%endif

Summary: Streaming zlib (gzip) support for python
Name: python-gzipstream
Version: 1.10.0
Release: 1%{?dist}
URL:        https://fedorahosted.org/spacewalk/wiki/Projects/python-gzipstream
Source0:    https://fedorahosted.org/releases/s/p/spacewalk/python-gzipstream-%{version}.tar.gz
License: GPLv2
Group: Development/Libraries
BuildRoot: %(mktemp -ud %{_tmppath}/%{name}-%{version}-%{release}-XXXXXX)
%if !0%{?suse_version}
BuildArch: noarch
%endif
BuildRequires: python-devel


%description
A streaming gzip handler.
gzipstream.GzipStream extends the functionality of the gzip.GzipFile class
to allow the processing of streaming data.


%prep
%setup -q

%build
%{__python} setup.py build

%install
rm -rf $RPM_BUILD_ROOT
%{__python} setup.py install -O1 --skip-build --root $RPM_BUILD_ROOT --prefix %{_usr}

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
%{python_sitelib}/*
%doc html
%doc LICENSE

%changelog
* Thu Feb 23 2012 Michael Mraka <michael.mraka@redhat.com> 1.7.1-1
- we are now just GPL

* Mon Oct 31 2011 Miroslav Suchý 1.6.2-1
- point to python-gzipstream specific URL
- add documentation

* Fri Jul 22 2011 Jan Pazdziora 1.6.1-1
- We only support version 14 and newer of Fedora, removing conditions for old
  versions.

* Tue Nov 30 2010 Miroslav Suchý <msuchy@redhat.com> 1.4.3-1
- 657531 - correct  condition for defining the python_sitelib macro
  (msuchy@redhat.com)

* Fri Nov 26 2010 Miroslav Suchý <msuchy@redhat.com> 1.4.2-1
- put license into doc section (msuchy@redhat.com)
- make setup quiet (msuchy@redhat.com)
- correct buildroot (msuchy@redhat.com)
- correct url and source url to point to fedorahosted (msuchy@redhat.com)

* Fri Nov 26 2010 Miroslav Suchý <msuchy@redhat.com> 1.4.1-1
- new package built with tito

