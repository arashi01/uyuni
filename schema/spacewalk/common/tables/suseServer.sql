--
-- Copyright (c) 2010 Novell
--
-- This software is licensed to you under the GNU General Public License,
-- version 2 (GPLv2). There is NO WARRANTY for this software, express or
-- implied, including the implied warranties of MERCHANTABILITY or FITNESS
-- FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
-- along with this software; if not, see
-- http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
--
--

create table
suseServer
(
    rhn_server_id     number
                      CONSTRAINT suseserver_rhns_id_fk
                      REFERENCES rhnserver (id)
                      ON DELETE CASCADE
                      PRIMARY KEY,
    guid              varchar2(256)
                      CONSTRAINT suseserver_guid_uq UNIQUE,
    secret            varchar2(256),
    ostarget          varchar2(256),
    ncc_sync_required CHAR(1 BYTE) DEFAULT ('N') NOT NULL ENABLE,

    created     date default(sysdate) not null,
    modified    date default(sysdate) not null
);

