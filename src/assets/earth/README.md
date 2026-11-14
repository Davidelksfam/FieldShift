# Earth orientation assets

`earth-blue-marble.jpg`, `earth-topology.png` and `night-sky.png` are copied byte-for-byte from `frontend/public/textures/` in the user-provided `sky-space-main.zip` (archive commit marker `467f18d325d8bc497eee15bf4fa6056322a4ea77`). The source `Globe3D.tsx` uses these as globe, bump and background maps. The upload does not contain individual asset licensing/observation metadata; no additional attribution or image date is inferred.

`plain-earth.jpg` is restored from this repository's `feat/earth-workspace` orientation texture: Three.js examples `earth_atmos_2048.jpg`, originally retrieved from https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg . The Three.js MIT license is included in `LICENSE-three.txt`.

These textures supply orientation visuals only. They do not feed the agricultural engine, establish current field conditions or indicate scientific coverage. Source observations still come exclusively from the existing data service. Assets are imported by Vite so their content hashes and dependencies are included in the first-party offline shell.
