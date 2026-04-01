vcl 4.1;

import xkey;

backend default {
    .host = "individuals-service";
    .port = "4002";
}

sub vcl_recv {
    # Handle CORS preflight
    if (req.method == "OPTIONS") {
        return (synth(204, "No Content"));
    }

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

    # CORS headers
    set resp.http.Access-Control-Allow-Origin = "*";
    set resp.http.Access-Control-Allow-Methods = "GET, PUT, OPTIONS";
    set resp.http.Access-Control-Allow-Headers = "Content-Type";
    set resp.http.Access-Control-Expose-Headers = "X-Cache, X-Cache-Hits, Age, ETag";
}

sub vcl_synth {
    if (resp.status == 204) {
        set resp.http.Access-Control-Allow-Origin = "*";
        set resp.http.Access-Control-Allow-Methods = "GET, PUT, OPTIONS";
        set resp.http.Access-Control-Allow-Headers = "Content-Type";
        set resp.http.Access-Control-Expose-Headers = "X-Cache, X-Cache-Hits, Age, ETag";
        return (deliver);
    }
}
