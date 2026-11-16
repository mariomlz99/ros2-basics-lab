# Shared runtime and checker corrections

This batch adapts independently reproduced KineNest defects to ROS 2 Basics Lab.
It preserves the seven-lesson course, current public name, storage keys, license,
and historical versioned assets.

## Included

- CHECKER-04-001: changing a parameter from `Hello World` to `Hello` (or the
  reverse) no longer passes when the program ignores it and only increments a
  publication counter.
- CHECKER-04-002: directly observed numeric and boolean parameter changes in
  the same typed message field now count, alongside string changes.
- CHECKER-04-003: a launched publisher hearing itself does not prove exchange
  with another launched process. Valid communication between distinct children
  still passes.
- ENDPOINT-08-001/002: retired Python Node objects cannot create resources or
  destroy a replacement's resources. The bridge rejects endpoint operations
  from nonexistent nodes and prevents a program destroying another's node.
- PYTHON-SERVICE-07-001: pending service futures belong to a particular Node
  object. Node destruction releases pending callbacks; same-name recreation
  cannot receive the old callback. Completed callbacks release their captures.
- CHECKER-07-004: nonexistent service server/client nodes are rejected before
  dispatch. This closes the reproduced protocol/API entry point, not all
  service-checker issues.

## Evidence and publication gate

The unchanged published source (`a90dd31`, asset `de4f27f7e298`) reproduces the
failures. Source tests exercise the actual Basics graph/checker and local
CPython compatibility code. Worker doubles in Node tests do not establish
browser-worker correctness.

The publication workflow also requires real Pyodide in Chromium and Firefox,
and real Python/C++ execution for parameter and launch attacks and legitimate
alternatives. The ordinary first-lesson browser checks cover desktop and narrow
viewports, keyboard focus, save/reload and Reset. Both the source mirror and
the new versioned assets are tested. Historical assets remain byte-identical.
Workflow results, not this document, establish whether these gates passed for
a particular commit.

The actual-worker checker gate covers string parameter changes. Numeric and
boolean alternatives have graph/helper tests in this batch; their specific
browser-worker paths are not yet independently certified.

Local evidence is retained outside the repository in
`audit/basics-shared-20261116/`; the original distribution is preserved in
`checkpoints/PRE_BASICS_SHARED_FIXES_20261116/` on the audit workstation.

## Native boundary and remaining work

The recorded native Jazzy observations reject retired publisher/subscription/
service factories and retired service-client calls. However, native Jazzy
returned a Timer when asked to create one through the destroyed Node in that
capture. The browser deliberately rejects this operation to keep resource
ownership and Stop cleanup coherent. This is a stricter browser limitation,
not a claim of identical native behavior. Detached service futures remain
pending; this patch adds no cancellation-state API.

This is the first publication batch from the shared findings queue, not full
course certification. Remaining work includes service completion/registration
evidence (CHECKER-07-001/002/003), C++ service callback lifetime, service discovery,
process/launch cancellation, installed-file behavior, session restart
persistence, shell recovery, translations and attribution follow-ups. Those
need their own Basics adaptations and release checks. Passing this batch does
not clear that backlog.
