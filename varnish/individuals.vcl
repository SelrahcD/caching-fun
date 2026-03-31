vcl 4.1;

import xkey;

backend default {
    .host = "individuals-service";
    .port = "4002";
}

sub vcl_recv {
    # Only cache GET requests
    if (req.method != "GET") {
        return (pass);
    }
}

sub vcl_backend_response {
    # Store xkey surrogate keys from backend header
    if (beresp.http.X-Xkey) {
        set beresp.http.xkey = beresp.http.X-Xkey;
    }

    # If backend signals a purge, purge by xkey
    if (beresp.http.X-Purge) {
        xkey.purge(beresp.http.X-Purge);
        unset beresp.http.X-Purge;
    }
}

sub vcl_deliver {
    # Add cache hit/miss header for the debug panel
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
    set resp.http.X-Cache-Hits = obj.hits;

    # Remove internal headers
    unset resp.http.X-Xkey;
}
