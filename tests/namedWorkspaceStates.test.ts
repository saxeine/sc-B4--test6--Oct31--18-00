import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { deleteNamedState, listNamedStates, saveNamedState } from "../src/utils/namedWorkspaceStates";

test("named states round-trip complete settings and images, replace and delete independently", async () => {
  const state = {
    buttonConfig: JSON.stringify({ customConfigs: { header_logo: { customIconData: "data:image/png;base64,bG9nbw==" } }, globalSettings: { headerItemsOrder: ["upload", "logo"] } }),
    boxImages: { 1: "data:image/png;base64,aW1hZ2U=" },
    sequencerPanelState: { playing: true, path: [3, 1], secondaryImages: { 3: "data:image/png;base64,c2Vjb25k" } },
  };
  await saveNamedState(" First ", state);
  await saveNamedState("Second", { ...state, boxImages: {} });
  let states = await listNamedStates<typeof state>();
  assert.equal(states.length, 2);
  assert.deepEqual(states.find((s) => s.name === "First")?.state, state);
  assert.ok(states.find((s) => s.name === "First")?.savedAt);
  await saveNamedState("First", { ...state, sequencerPanelState: { ...state.sequencerPanelState, playing: false } });
  states = await listNamedStates<typeof state>();
  assert.equal(states.length, 2);
  assert.equal(states.find((s) => s.name === "First")?.state.sequencerPanelState.playing, false);
  await deleteNamedState("First");
  assert.deepEqual((await listNamedStates()).map((s) => s.name), ["Second"]);
  await deleteNamedState("Second");
  await assert.rejects(saveNamedState("   ", state), /name/);
});
