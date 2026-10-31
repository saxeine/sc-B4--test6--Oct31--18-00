# Named workspace states

Open **Utilities → Save & Exit**, or use the save icon in **Panel Controls → Spread**,
to save a named state or recall one. Both entry points share the same saved states.
Saving closes the originating panel after the browser confirms the write; **Exit
without saving** closes it without creating a snapshot. Saving an existing name asks before
replacing it. Recall and delete also ask for confirmation.

A state captures button and label customizations, global settings and header /
panel order (including the logo), front-page grid, images, links and rotation,
and the complete sequencer state. Recall replaces those settings immediately;
other workspace content, such as the storyboard, is not part of the snapshot.

Named states are stored in this browser's IndexedDB, including image data. They
are not synced between devices or accounts and may be removed when browser site
data is cleared. The dialog reports storage failures rather than exiting as if
the save succeeded. Recalling a state applies it to the current workspace and
its normal persistence mechanisms.
