let scene, camera, renderer, controls, objects = [];
let selectedObject = null; // Bu değişkeni global olarak tanımlayın

document.addEventListener('DOMContentLoaded', () => {
    init();
    const fileInput = document.getElementById('model-upload');
    fileInput.addEventListener('change', handleModelUpload);
    const colorPicker = document.getElementById('color-picker');
    colorPicker.addEventListener('input', handleColorChange); // Renk değiştirme olayını dinlemek için
});


/*document.getElementById('color-picker').addEventListener('input', (event) => {
    if (selectedObject) {
        if (selectedObject.material) {
            let material = selectedObject.material;
            let color = event.target.value;
            
            // Materyal türü ve özelliklerini logla
            console.log("Seçilen nesnenin materyali:", material);
            console.log("Materyal Türü:", material.type);
            console.log("Materyal Adı:", material.name);
            
            // Materyal türü kontrolü yapın
            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhongMaterial ||
                material instanceof THREE.MeshBasicMaterial) {
                    
                material.color.set(color);
                material.needsUpdate = true; // Materyali güncellemek için ekleyin
                console.log("Materyal rengi başarıyla değiştirildi:", material.color);
            } else {
                console.error("Seçilen nesnenin materyali desteklenmiyor. Materyal türü:", material.type);
            }
        } else {
            console.error("Seçilen nesnenin materyali bulunmuyor.");
        }
    } else {
        console.error("Seçili bir nesne yok.");
    }
}); */

function handleColorChange(event) {
    // Bu fonksiyonu artık kullanmayacağız
}








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

    // Seçim ve renk değiştirme işlemini doğrudan buraya entegre ediyoruz
    renderer.domElement.addEventListener('click', (event) => {
        const rect = renderer.domElement.getBoundingClientRect(); // Ekran boyutunu al
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
    
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
    
        const intersects = raycaster.intersectObjects(objects, true);
    
        if (intersects.length > 0) {
            const intersect = intersects[0];
            selectedObject = intersect.object;
    
            if (selectedObject.isMesh) {
                // Yeni bir materyal kopyası oluştur
                selectedObject.material = selectedObject.material.clone();
    
                const face = intersect.face;
                const color = new THREE.Color(document.getElementById('color-picker').value);
                const geometry = selectedObject.geometry;
    
                // Vertex renklerini ayarla
                if (!geometry.attributes.color) {
                    const colors = [];
                    for (let i = 0; i < geometry.attributes.position.count; i++) {
                        colors.push(1, 1, 1); // Beyaz varsayılan renk
                    }
                    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                }
    
                const vertexColors = geometry.attributes.color;
                vertexColors.setXYZ(face.a, color.r, color.g, color.b);
                vertexColors.setXYZ(face.b, color.r, color.g, color.b);
                vertexColors.setXYZ(face.c, color.r, color.g, color.b);
                vertexColors.needsUpdate = true;
    
                selectedObject.material.vertexColors = true;
                selectedObject.material.needsUpdate = true;
    
                console.log("Yüzey rengi başarıyla değiştirildi.");
                console.log("Değiştirilen Mesh:", selectedObject.name || selectedObject.uuid);
                console.log("Değiştirilen Yüzey Vertexleri:", {
                    vertexA: face.a,
                    vertexB: face.b,
                    vertexC: face.c
                });
                console.log("Yeni Renk:", color);
            }
        } else {
            console.log("Herhangi bir nesne seçilmedi.");
        }
    });
    
    
    // Yüzey alanını hesaplayan fonksiyon
    function calculateFaceArea(geometry, face) {
        const vA = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, face.a);
        const vB = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, face.b);
        const vC = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, face.c);
    
        const edge1 = new THREE.Vector3().subVectors(vB, vA);
        const edge2 = new THREE.Vector3().subVectors(vC, vA);
        const crossProduct = new THREE.Vector3().crossVectors(edge1, edge2);
    
        return crossProduct.length() / 2; // Üçgenin alanı
    }
    
    
    



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


function onDocumentMouseClick(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;

        // Yalnızca Mesh ve materyali olan nesneleri seç
        if (intersectedObject.isMesh && intersectedObject.material) {
            selectedObject = intersectedObject;
            console.log("Seçilen mesh:", selectedObject);
        } else {
            console.error("Seçilen nesne bir mesh değil veya materyali yok.");
            selectedObject = null; // Seçim iptal edilir
        }
    } else {
        console.error("Herhangi bir nesne seçilmedi.");
        selectedObject = null; // Seçim iptal edilir
    }
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
                    if (child.isMesh) {
                        child.material.vertexColors = true;
                        const geometry = child.geometry;

                        const colors = [];
                        const color = new THREE.Color();
                        for (let i = 0; i < geometry.attributes.position.count; i++) {
                            color.setRGB(1, 1, 1); // Başlangıç rengi (beyaz)
                            colors.push(color.r, color.g, color.b);
                        }
                        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
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




