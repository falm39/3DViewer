let scene, camera, renderer, controls, objects = [];

document.addEventListener('DOMContentLoaded', () => {
    init();
    const fileInput = document.getElementById('model-upload');
    fileInput.addEventListener('change', handleModelUpload);
});




function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputEncoding = THREE.sRGBEncoding; // Renklerin doğru işlenmesi için gerekli
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.getElementById('container').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);


    // Add lights
    const light = new THREE.DirectionalLight(0xffffff, 2); // Işık şiddetini artırın
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x808080); // Ambient ışığı ekleyin
    scene.add(ambientLight);



    // Render the scene
    render();

    // Add event listeners
    window.addEventListener('resize', onWindowResize, false);
    
    
}

function render() {
    requestAnimationFrame(render);
    controls.update(); // Kontrolleri sürekli olarak güncelle

    renderer.render(scene, camera);
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleModelUpload(event) {
    const file = event.target.files[0];
    console.log("Dosya yüklendi:", file);
    const reader = new FileReader();

    reader.onload = function(e) {
        const zip = new JSZip();
        zip.loadAsync(e.target.result).then(async function(zip) {
            console.log("ZIP içeriği:", zip.files);

            const gltfFile = zip.file('scene.gltf');
            const binFile = zip.file('scene.bin');
            const textureFiles = {};

            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && relativePath.startsWith('textures/')) {
                    const fileName = relativePath.split('/').pop();
                    textureFiles[fileName] = zipEntry;
                }
            });

            if (!gltfFile || !binFile) {
                console.error('GLTF veya BIN dosyası bulunamadı.');
                return;
            }

            console.log('GLTF ve BIN dosyaları bulundu.');

            const gltfText = await gltfFile.async('text');
            const binBlob = await binFile.async('blob');
            const binUrl = URL.createObjectURL(binBlob);

            const textureUrls = {};
            for (const [textureName, textureFile] of Object.entries(textureFiles)) {
                const textureBlob = await textureFile.async('blob');
                const textureUrl = URL.createObjectURL(textureBlob);
                textureUrls[textureName] = textureUrl;
                console.log("Texture yüklendi:", textureName, textureUrl);
            }

            const modifiedGltfText = gltfText.replace(/"uri":\s*"([^"]+)"/g, (match, p1) => {
                const textureFileName = p1.split('/').pop();
                if (p1 === 'scene.bin') {
                    return `"uri": "${binUrl}"`;
                } else if (textureUrls[textureFileName]) {
                    return `"uri": "${textureUrls[textureFileName]}"`;
                }
                return match;
            });

            const gltfBlob = new Blob([modifiedGltfText], { type: 'application/json' });
            const gltfUrl = URL.createObjectURL(gltfBlob);

            const loader = new THREE.GLTFLoader();
            loader.load(gltfUrl, function(gltf) {
                console.log("GLTF modeli başarıyla yüklendi.");
            
                // GLTF dosyasının içeriğini kontrol ediyoruz
                if (gltf.parser.json.buffers && gltf.parser.json.buffers.length > 0) {
                    console.log("Bin dosyası tespit edildi:", gltf.parser.json.buffers[0].uri);
                } else {
                    console.error("Bin dosyası tespit edilemedi.");
                }
            
                // Texture'ları kontrol ediyoruz
                gltf.scene.traverse(function (child) {
                    if (child.isMesh && child.material) {
                        if (child.material.map) {
                            console.log("Albedo texture yüklendi:", child.material.map.name);
                        } else {
                            console.error("Albedo texture yüklenmedi.");
                        }
            
                        if (child.material.normalMap) {
                            console.log("Normal map yüklendi:", child.material.normalMap.name);
                        } else {
                            console.log("Normal map bulunamadı.");
                        }
            
                        if (child.material.metalnessMap) {
                            console.log("Metalness map yüklendi:", child.material.metalnessMap.name);
                        } else {
                            console.log("Metalness map bulunamadı.");
                        }
            
                        if (child.material.roughnessMap) {
                            console.log("Roughness map yüklendi:", child.material.roughnessMap.name);
                        } else {
                            console.log("Roughness map bulunamadı.");
                        }
                    }
                });
            
                // Model sahneye eklenmeden önce boyutunu ve merkezini hesapla
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
            
                // Modeli sahne merkezine yerleştir
                gltf.scene.position.sub(center); // Modelin merkezini sahnenin merkezine al
            
                // Kamerayı modelin üzerine yerleştir
                camera.position.set(0, size.y / 2, size.z * 2);
                camera.lookAt(center); // Kamerayı modelin merkezine odakla
            
                // Işıklandırma ayarları (isteğe bağlı, zaten varsa eklemeyin)
                const light = new THREE.DirectionalLight(0xffffff, 2);
                light.position.set(5, 5, 5).normalize();
                scene.add(light);
            
                const ambientLight = new THREE.AmbientLight(0x808080);
                scene.add(ambientLight);
            
                // Modeli sahneye ekle
                scene.add(gltf.scene);
                objects.push(...gltf.scene.children);
            
                console.log("Model sahneye eklendi.");
            }, undefined, function(error) {
                console.error("Model yüklenirken hata oluştu:", error);
            });
            
            
            
        }).catch(error => {
            console.error("ZIP dosyası okunurken hata oluştu:", error);
        });
    };

    reader.readAsArrayBuffer(file);
}
