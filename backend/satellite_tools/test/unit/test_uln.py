# coding: utf-8
"""
Unit tests for the ULN authentication library.
"""
import sys
import pytest
from unittest.mock import MagicMock, patch

try:
    sys.path.insert(0, __file__.split("/test/unit")[0])
    import ulnauth
except ImportError as ex:
    ulnauth = None


@pytest.fixture
def uln_auth_instance():
    """
    Instantiate ULNAuth.
    """
    return ulnauth.ULNAuth()


@pytest.fixture
def cfg_parser():
    """
    Get cfgparser dummy class
    """
    class CfgParser(dict):
        cfg = {}
        def read(self, path):
            self["main"] = self.cfg

    return CfgParser


@pytest.mark.skipif(ulnauth is None, reason="'ulnauth' failed to be imported")
class TestULNAuth:
    """
    Test ULN auth.
    """
    def test_get_hostname_uln(self, uln_auth_instance):
        """
        Test ULN uri raises an exception if protocol is not ULN.
        """
        with pytest.raises(ulnauth.RhnSyncException) as exc:
            uln_auth_instance.get_hostname("foo://something/else")
        assert "URL must start with 'uln://'" in str(exc)

    def test_get_hostname_default(self, uln_auth_instance):
        """
        Test ULN uri inserts a default hostname, if not specified.
        """
        netloc, path  = uln_auth_instance.get_hostname("uln:///suse")
        assert netloc == ulnauth.ULNAuth.ULN_DEFAULT_HOST
        assert path == "/suse"

    def test_get_hostname_custom(self, uln_auth_instance):
        """
        Test ULN uri inserts a custom hostname, if specified.
        """
        netloc, path  = uln_auth_instance.get_hostname("uln://scc.suse.de/suse")
        assert netloc == "scc.suse.de"
        assert path == "/suse"

    @patch("os.path.exists", MagicMock(return_value=False))
    @patch("os.access", MagicMock(return_value=False))
    def test_get_credentials_not_found(self, uln_auth_instance):
        """
        Test credentials ULN configuration exists.
        """
        with pytest.raises(ulnauth.RhnSyncException) as exc:
            uln_auth_instance.get_credentials()
        assert "'/etc/rhn/spacewalk-repo-sync/uln.conf' does not exists" in str(exc)

    @patch("os.path.exists", MagicMock(return_value=True))
    @patch("os.access", MagicMock(return_value=False))
    def test_get_credentials_access_denied(self, uln_auth_instance):
        """
        Test credentials ULN configuration readable.
        """
        with pytest.raises(ulnauth.RhnSyncException) as exc:
            uln_auth_instance.get_credentials()
        assert "Permission denied to '/etc/rhn/spacewalk-repo-sync/uln.conf'" in str(exc)

    @patch("os.path.exists", MagicMock(return_value=True))
    @patch("os.access", MagicMock(return_value=False))
    def test_get_credentials_access_denied(self, uln_auth_instance):
        """
        Test credentials ULN configuration readable.
        """
        with pytest.raises(ulnauth.RhnSyncException) as exc:
            uln_auth_instance.get_credentials()
        assert "Permission denied to '/etc/rhn/spacewalk-repo-sync/uln.conf'" in str(exc)

    @patch("os.path.exists", MagicMock(return_value=True))
    @patch("os.access", MagicMock(return_value=True))
    def test_get_credentials_credentials(self, uln_auth_instance, cfg_parser):
        """
        Test credentials ULN
        """
        cfg_parser.cfg = {"username": "Darth Vader", "password": "f1ndE4rth"}
        with patch("configparser.ConfigParser", cfg_parser):
            username, password = uln_auth_instance.get_credentials()
            assert username == "Darth Vader"
            assert password == "f1ndE4rth"

    @patch("os.path.exists", MagicMock(return_value=True))
    @patch("os.access", MagicMock(return_value=True))
    def test_get_credentials_credentials_not_found(self, uln_auth_instance, cfg_parser):
        """
        Test credentials ULN was not found
        """
        with patch("configparser.ConfigParser", cfg_parser):
            with pytest.raises(AssertionError) as exc:
                uln_auth_instance.get_credentials()
            assert "Credentials were not found in the configuration" in str(exc)

    @patch("os.path.exists", MagicMock(return_value=True))
    @patch("os.access", MagicMock(return_value=True))
    def test_get_credentials_not_all_credentials_found(self, uln_auth_instance, cfg_parser):
        """
        Test partial credentials ULN found
        """
        cfg_parser.cfg = {"username": "Darth Vader"}
        with patch("configparser.ConfigParser", cfg_parser):
            with pytest.raises(AssertionError) as exc:
                uln_auth_instance.get_credentials()
            assert "Credentials were not found in the configuration" in str(exc)

        cfg_parser.cfg["password"] = "something"
        del cfg_parser.cfg["username"]
        with patch("configparser.ConfigParser", cfg_parser):
            with pytest.raises(AssertionError) as exc:
                uln_auth_instance.get_credentials()
            assert "Credentials were not found in the configuration" in str(exc)
