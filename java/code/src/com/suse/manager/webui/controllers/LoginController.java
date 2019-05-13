/**
 * Copyright (c) 2018 SUSE LLC
 *
 * This software is licensed to you under the GNU General Public License,
 * version 2 (GPLv2). There is NO WARRANTY for this software, express or
 * implied, including the implied warranties of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
 * along with this software; if not, see
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
 *
 * Red Hat trademarks are not licensed under GPLv2. No permission is
 * granted to use or replicate Red Hat trademarks that are incorporated
 * in this software or its documentation.
 */
package com.suse.manager.webui.controllers;

import static com.suse.manager.webui.utils.SparkApplicationHelper.json;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.redhat.rhn.domain.user.User;
import com.redhat.rhn.frontend.action.LoginAction;
import com.redhat.rhn.frontend.action.LoginHelper;
import com.redhat.rhn.frontend.servlets.PxtSessionDelegateFactory;
import com.redhat.rhn.manager.acl.AclManager;
import com.redhat.rhn.manager.user.UserManager;

import spark.ModelAndView;
import spark.Request;
import spark.Response;

/**
 * Spark controller class to perform the login.
 */
public class LoginController {

    private static Logger log = Logger.getLogger(LoginController.class);
    private static final Gson GSON = new GsonBuilder().create();
    private static final String URL_CREATE_FIRST_USER = "/newlogin/CreateFirstUser.do";

    private LoginController() { }

    /**
     * Return the login page.
     *
     * @param request the request object
     * @param response the response object
     * @return the model and view
     */
    public static ModelAndView loginView(Request request, Response response) {
        // Redirect to user creation if needed
        if (!UserManager.satelliteHasUsers()) {
            response.redirect(URL_CREATE_FIRST_USER);
        }

        // Handle "url_bounce" parameters
        String urlBounce = request.queryParams("url_bounce");
        String reqMethod = request.queryParams("request_method");
        urlBounce = LoginAction.updateUrlBounce(urlBounce, reqMethod);

        // In case we are authenticated go directly to redirect target
        if (AclManager.hasAcl("user_authenticated()", request.raw(), null)) {
            log.debug("Already authenticated, redirecting to: " + urlBounce);
            response.redirect(urlBounce);
        }

        Map<String, Object> model = new HashMap<>();
        model.put("url_bounce", urlBounce);
        // TODO: Support request method for redirection?
        // model.put("request_method", reqMethod);
        return new ModelAndView(model, "login/login.jade");
    }

    /**
     * Perform the login.
     *
     * @param request the request object
     * @param response the response object
     * @return the model and view
     */
    public static String login(Request request, Response response) {
        List<String> errors = new ArrayList<>();
        LoginCredentials creds = GSON.fromJson(request.body(), LoginCredentials.class);
        User user = LoginHelper.loginUser(creds.getLogin(), creds.getPassword(), errors);
        if (errors.isEmpty()) {
            log.info("LOCAL AUTH SUCCESS: [" + user.getLogin() + "]");

            // Update the user and the session
            user.setLastLoggedIn(new Date());
            UserManager.storeUser(user);
            PxtSessionDelegateFactory.getInstance().newPxtSessionDelegate().updateWebUserId(
                    request.raw(), response.raw(), user.getId());

            // Update errata cache for the logged in user's organization
            LoginHelper.publishUpdateErrataCacheEvent(user.getOrg());

            return json(response, new LoginResult(true, new String[0]));
        }
        else {
            log.error("LOCAL AUTH FAILURE: [" + creds.getLogin() + "]");
            return json(response, new LoginResult(false, errors.toArray(new String[errors.size()])));
        }
    }

    /**
     * Class to hold the login credentials.
     */
    public static class LoginCredentials {
        private String login;
        private String password;

        /**
         * Default constructor.
         */
        public LoginCredentials() {
        }

        /**
         * @return the login
         */
        public String getLogin() {
            return login;
        }

        /**
         * @return the password
         */
        public String getPassword() {
            return password;
        }
    }

    /**
     * Class to hold the login return results.
     */
    public static class LoginResult {

        private final boolean success;
        private final String[] messages;

        /**
         * @param successIn success
         * @param messagesIn messages
         */
        public LoginResult(boolean successIn, String... messagesIn) {
            this.success = successIn;
            this.messages = messagesIn;
        }

        /**
         * @return success
         */
        public boolean isSuccess() {
            return success;
        }

        /**
         * @return messages
         */
        public String[] getMessages() {
            return messages;
        }
    }
}
