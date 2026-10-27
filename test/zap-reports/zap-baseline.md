# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 3 |
| Informational | 6 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 1    |
| Info | Informational | http://127.0.0.1:3000 | Percentage of responses with status code 2xx | 93 % |
| Info | Informational | http://127.0.0.1:3000 | Percentage of responses with status code 4xx | 6 % |
| Info | Informational | http://127.0.0.1:3000 | Percentage of endpoints with content type image/pjpeg | 18 % |
| Info | Informational | http://127.0.0.1:3000 | Percentage of endpoints with content type image/png | 22 % |
| Info | Informational | http://127.0.0.1:3000 | Percentage of endpoints with content type text/css | 11 % |
| Info | Informational | http://127.0.0.1:3000 | Percentage of endpoints with content type text/html | 39 % |
| Info | Informational | http://127.0.0.1:3000 | Percentage of endpoints with content type text/javascript | 7 % |
| Info | Informational | http://127.0.0.1:3000 | Percentage of endpoints with method GET | 96 % |
| Info | Informational | http://127.0.0.1:3000 | Percentage of endpoints with method POST | 3 % |
| Info | Informational | http://127.0.0.1:3000 | Count of total endpoints | 53    |
| Info | Informational | http://127.0.0.1:3000 | Percentage of slow responses | 89 % |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Cross-Origin-Embedder-Policy Header Missing or Invalid | Low | 4 |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Low | Systemic |
| Permissions Policy Header Not Set | Low | Systemic |
| Authentication Request Identified | Informational | 1 |
| Information Disclosure - Suspicious Comments | Informational | 9 |
| Modern Web Application | Informational | 2 |
| Session Management Response Identified | Informational | 3 |
| Storable and Cacheable Content | Informational | Systemic |
| Storable but Non-Cacheable Content | Informational | 2 |




## Alert Detail



### [ Cross-Origin-Embedder-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Embedder-Policy header is a response header that prevents a document from loading any cross-origin resources that don't explicitly grant the document permission (using CORP or CORS).

* URL: http://127.0.0.1:3000
  * Node Name: `http://127.0.0.1:3000`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://127.0.0.1:3000/auth/login
  * Node Name: `http://127.0.0.1:3000/auth/login`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://127.0.0.1:3000/products
  * Node Name: `http://127.0.0.1:3000/products`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://127.0.0.1:3000/products%3Fcategory=earring
  * Node Name: `http://127.0.0.1:3000/products (category)`
  * Method: `GET`
  * Parameter: `Cross-Origin-Embedder-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``


Instances: 4

### Solution

Ensure that the application/web server sets the Cross-Origin-Embedder-Policy header appropriately, and that it sets the Cross-Origin-Embedder-Policy header to 'require-corp' for documents.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Embedder-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-embedder-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Cross-Origin-Resource-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Resource-Policy header is an opt-in header designed to counter side-channels attacks like Spectre. Resource should be specifically set as shareable amongst different origins.

* URL: http://127.0.0.1:3000
  * Node Name: `http://127.0.0.1:3000`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: `same-site`
  * Other Info: ``
* URL: http://127.0.0.1:3000/auth/login
  * Node Name: `http://127.0.0.1:3000/auth/login`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: `same-site`
  * Other Info: ``
* URL: http://127.0.0.1:3000/css/common.css
  * Node Name: `http://127.0.0.1:3000/css/common.css`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: `same-site`
  * Other Info: ``
* URL: http://127.0.0.1:3000/js/common.js
  * Node Name: `http://127.0.0.1:3000/js/common.js`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: `same-site`
  * Other Info: ``
* URL: http://127.0.0.1:3000/products
  * Node Name: `http://127.0.0.1:3000/products`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: `same-site`
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that the application/web server sets the Cross-Origin-Resource-Policy header appropriately, and that it sets the Cross-Origin-Resource-Policy header to 'same-origin' for all web pages.
'same-site' is considered as less secured and should be avoided.
If resources must be shared, set the header to 'cross-origin'.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Resource-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-resource-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Permissions Policy Header Not Set ](https://www.zaproxy.org/docs/alerts/10063/)



##### Low (Medium)

### Description

Permissions Policy Header is an added layer of security that helps to restrict from unauthorized access or usage of browser/client features by web resources. This policy ensures the user privacy by limiting or specifying the features of the browsers can be used by the web resources. Permissions Policy provides a set of standard HTTP headers that allow website owners to limit which features of browsers can be used by the page such as camera, microphone, location, full screen etc.

* URL: http://127.0.0.1:3000
  * Node Name: `http://127.0.0.1:3000`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://127.0.0.1:3000/auth/login
  * Node Name: `http://127.0.0.1:3000/auth/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://127.0.0.1:3000/products
  * Node Name: `http://127.0.0.1:3000/products`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://127.0.0.1:3000/robots.txt
  * Node Name: `http://127.0.0.1:3000/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://127.0.0.1:3000/sitemap.xml
  * Node Name: `http://127.0.0.1:3000/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution

Ensure that your web server, application server, load balancer, etc. is configured to set the Permissions-Policy header.

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy)
* [ https://developer.chrome.com/blog/feature-policy/ ](https://developer.chrome.com/blog/feature-policy/)
* [ https://scotthelme.co.uk/a-new-security-header-feature-policy/ ](https://scotthelme.co.uk/a-new-security-header-feature-policy/)
* [ https://w3c.github.io/webappsec-feature-policy/ ](https://w3c.github.io/webappsec-feature-policy/)
* [ https://www.smashingmagazine.com/2018/12/feature-policy/ ](https://www.smashingmagazine.com/2018/12/feature-policy/)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://127.0.0.1:3000/auth/login
  * Node Name: `http://127.0.0.1:3000/auth/login ()(_csrf,loginId,password)`
  * Method: `POST`
  * Parameter: `loginId`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=loginId
userValue=ZAP
passwordParam=password
referer=http://127.0.0.1:3000/auth/login
csrfToken=_csrf`


Instances: 1

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Information Disclosure - Suspicious Comments ](https://www.zaproxy.org/docs/alerts/10027/)



##### Informational (Medium)

### Description

The response appears to contain suspicious comments which may help an attacker.

* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `	dataType: null,
		username: null,
		password:`
  * Other Info: `The following pattern was used: \bUSERNAME\b and was detected in likely comment: "/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		t", see evidence field for the suspicious comment/snippet.`
* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ` be adjusted by the user`
  * Other Info: `The following pattern was used: \bUSER\b and was detected 10 times, the first in likely comment: "// Can be adjusted by the user", see evidence field for the suspicious comment/snippet.`
* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ` data to user code (TODO: Drop _data, _remov`
  * Other Info: `The following pattern was used: \bTODO\b and was detected 2 times, the first in likely comment: "//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)", see evidence field for the suspicious comment/snippet.`
* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `Query prototype for later instantiation`
  * Other Info: `The following pattern was used: \bLATER\b and was detected 6 times, the first in likely comment: "// Give the init function the jQuery prototype for later instantiation", see evidence field for the suspicious comment/snippet.`
* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `S-like environments where a proper `window``
  * Other Info: `The following pattern was used: \bWHERE\b and was detected 10 times, the first in likely comment: "// For CommonJS and CommonJS-like environments where a proper `window`", see evidence field for the suspicious comment/snippet.`
* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `or POS matching in `select``
  * Other Info: `The following pattern was used: \bSELECT\b and was detected in likely comment: "// We use this for POS matching in `select`", see evidence field for the suspicious comment/snippet.`
* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `s/detail?id=378607 (bug restricted)`
  * Other Info: `The following pattern was used: \bBUG\b and was detected 2 times, the first in likely comment: "// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)", see evidence field for the suspicious comment/snippet.`
* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `ts on a `[name='']` query in some cases.`
  * Other Info: `The following pattern was used: \bQUERY\b and was detected 3 times, the first in likely comment: "// IE 11 doesn't find elements on a `[name='']` query in some cases.", see evidence field for the suspicious comment/snippet.`
* URL: http://127.0.0.1:3000/js/jquery-4.0.0.js
  * Node Name: `http://127.0.0.1:3000/js/jquery-4.0.0.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `ust the one element from the set`
  * Other Info: `The following pattern was used: \bFROM\b and was detected 54 times, the first in likely comment: "// Return just the one element from the set", see evidence field for the suspicious comment/snippet.`


Instances: 9

### Solution

Remove all comments that return information that may help an attacker and fix any underlying problems they refer to.

### Reference



#### CWE Id: [ 615 ](https://cwe.mitre.org/data/definitions/615.html)


#### WASC Id: 13

#### Source ID: 3

### [ Modern Web Application ](https://www.zaproxy.org/docs/alerts/10109/)



##### Informational (Medium)

### Description

The application appears to be a modern web application. If you need to explore it automatically then the Client Spider may well be more effective than the standard one.

* URL: http://127.0.0.1:3000
  * Node Name: `http://127.0.0.1:3000`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<a href="#" class="active">공지사항</a>`
  * Other Info: `Links have been found that do not have traditional href attributes, which is an indication that this is a modern web application.`
* URL: http://127.0.0.1:3000/
  * Node Name: `http://127.0.0.1:3000/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<a href="#" class="active">공지사항</a>`
  * Other Info: `Links have been found that do not have traditional href attributes, which is an indication that this is a modern web application.`


Instances: 2

### Solution

This is an informational alert and so no changes are required.

### Reference




#### Source ID: 3

### [ Session Management Response Identified ](https://www.zaproxy.org/docs/alerts/10112/)



##### Informational (Medium)

### Description

The given response has been identified as containing a session management token. The 'Other Info' field contains a set of header tokens that can be used in the Header Based Session Management Method. If the request is in a context which has a Session Management Method set to "Auto-Detect" then this rule will change the session management to use the tokens identified.

* URL: http://127.0.0.1:3000
  * Node Name: `http://127.0.0.1:3000`
  * Method: `GET`
  * Parameter: `csrf_session`
  * Attack: ``
  * Evidence: `csrf_session`
  * Other Info: `cookie:csrf_session`
* URL: http://127.0.0.1:3000/sitemap.xml
  * Node Name: `http://127.0.0.1:3000/sitemap.xml`
  * Method: `GET`
  * Parameter: `csrf_session`
  * Attack: ``
  * Evidence: `csrf_session`
  * Other Info: `cookie:csrf_session`
* URL: http://127.0.0.1:3000/sitemap.xml
  * Node Name: `http://127.0.0.1:3000/sitemap.xml`
  * Method: `GET`
  * Parameter: `csrf_session`
  * Attack: ``
  * Evidence: `csrf_session`
  * Other Info: `cookie:csrf_session`


Instances: 3

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/session-mgmt-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/session-mgmt-id/)



#### Source ID: 3

### [ Storable and Cacheable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are storable by caching components such as proxy servers, and may be retrieved directly from the cache, rather than from the origin server by the caching servers, in response to similar requests from other users. If the response data is sensitive, personal or user-specific, this may result in sensitive information being leaked. In some cases, this may even result in a user gaining complete control of the session of another user, depending on the configuration of the caching components in use in their environment. This is primarily an issue where "shared" caching servers such as "proxy" caches are configured on the local network. This configuration is typically found in corporate or educational environments, for instance.

* URL: http://127.0.0.1:3000
  * Node Name: `http://127.0.0.1:3000`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`
* URL: http://127.0.0.1:3000/auth/login
  * Node Name: `http://127.0.0.1:3000/auth/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`
* URL: http://127.0.0.1:3000/products
  * Node Name: `http://127.0.0.1:3000/products`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`
* URL: http://127.0.0.1:3000/robots.txt
  * Node Name: `http://127.0.0.1:3000/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`
* URL: http://127.0.0.1:3000/sitemap.xml
  * Node Name: `http://127.0.0.1:3000/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`

Instances: Systemic


### Solution

Validate that the response does not contain sensitive, personal or user-specific information. If it does, consider the use of the following HTTP response headers, to limit, or prevent the content being stored and retrieved from the cache by another user:
Cache-Control: no-cache, no-store, must-revalidate, private
Pragma: no-cache
Expires: 0
This configuration directs both HTTP 1.0 and HTTP 1.1 compliant caching servers to not store the response, and to not retrieve the response (without validation) from the cache, in response to a similar request.

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3

### [ Storable but Non-Cacheable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are storable by caching components such as proxy servers, but will not be retrieved directly from the cache, without validating the request upstream, in response to similar requests from other users.

* URL: http://127.0.0.1:3000/css/common.css
  * Node Name: `http://127.0.0.1:3000/css/common.css`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `max-age=0`
  * Other Info: ``
* URL: http://127.0.0.1:3000/js/common.js
  * Node Name: `http://127.0.0.1:3000/js/common.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `max-age=0`
  * Other Info: ``


Instances: 2

### Solution



### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3


