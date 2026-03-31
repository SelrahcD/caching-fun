vcl 4.1;

import xkey;

backend default {
    .host = "directory-service";
    .port = "4001";
}

sub vcl_recv {
    if (req.method != "GET") {
        return (pass);
    }
}

sub vcl_backend_response {
    if (beresp.http.X-Xkey) {
        set beresp.http.xkey = beresp.http.X-Xkey;
    }

    if (beresp.http.X-Purge) {
        # X-Purge may contain space-separated keys (e.g., "team-1 teams-list")
        xkey.purge(beresp.http.X-Purge);
        unset beresp.http.X-Purge;
    }
}

sub vcl_deliver {
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
    set resp.http.X-Cache-Hits = obj.hits;
    unset resp.http.X-Xkey;
}
