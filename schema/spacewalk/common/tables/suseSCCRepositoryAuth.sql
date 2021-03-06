--
-- Copyright (c) 2018 SUSE LLC
--
-- This software is licensed to you under the GNU General Public License,
-- version 2 (GPLv2). There is NO WARRANTY for this software, express or
-- implied, including the implied warranties of MERCHANTABILITY or FITNESS
-- FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
-- along with this software; if not, see
-- http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
--
-- Red Hat trademarks are not licensed under GPLv2. No permission is
-- granted to use or replicate Red Hat trademarks that are incorporated
-- in this software or its documentation.
--

CREATE TABLE suseSCCRepositoryAuth
(
    id             NUMBER NOT NULL PRIMARY KEY,
    repo_id        NUMBER NOT NULL
                       CONSTRAINT suse_sccrepoauth_rid_fk
		       REFERENCES suseSCCRepository (id),
--                     NO ON DELETE !
    credentials_id NUMBER NULL
                       CONSTRAINT suse_sccrepo_credsid_fk
                       REFERENCES suseCredentials (id),
--                     NO ON DELETE !,
    source_id      NUMBER NULL
                         CONSTRAINT suse_sccrepo_src_id_fk
                             REFERENCES rhnContentSource (id)
                             ON DELETE SET NULL,
    auth_type      VARCHAR2(10) NOT NULL,
    auth           VARCHAR2(4000) NULL,
    created        timestamp with local time zone
                       DEFAULT (current_timestamp) NOT NULL,
    modified       timestamp with local time zone
                       DEFAULT (current_timestamp) NOT NULL
)
ENABLE ROW MOVEMENT
;

CREATE SEQUENCE suse_sccrepoauth_id_seq;
