# Multiple tabs and saved work

Tabs can run independently, but tabs in the same browser profile share saved
workspaces. A stale tab cannot replace a newer save from another tab. It displays
an explicit conflict warning, keeps its current in-memory work, and warns before
closing or reloading. Export that tab's source workspace before leaving, then
reload to read the latest saved session. This does not automatically merge edits
or make simultaneous editing of one saved workspace collaborative. Separate
browser profiles/contexts have independent saved work.

The storage upgrade preserves existing saved records. Tabs running older code
without conflict protection can no longer save after the upgrade: they show a
save error. Export any unsaved source in those tabs, then reload the current
application. Historical runtime assets remain available; a storage write failure
must not be treated as a successful save. Source export covers the source
workspace, not arbitrary files elsewhere in the virtual filesystem.
