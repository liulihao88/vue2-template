import * as THREE from 'three';
import { ObjectLoader } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// 一个强大的辅助函数来序列化场景并检查原始的 JSON 数据结构
// 这个函数会过滤掉一些无法序列化的函数或循环引用
function fixSceneForGLTFExport(scene) {
    console.log("--- 开始进行强力数据修复 ---");
    let fixesApplied = 0;
    scene.traverse((object) => {
        if (object.isMesh && object.geometry && object.material) {
            const geometry = object.geometry;
            // 确保material是一个数组，以便统一处理（一个网格可以有多种材质）
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            // 检查几何体是否有UV属性
            const hasUV = geometry.attributes.uv || geometry.attributes.uv2;

            let materialNeedsFixing = false;
            if (!hasUV) {
                materials.forEach(mat => {
                    // 检查任何一种可能导致问题的纹理
                    if (mat.map || mat.normalMap || mat.roughnessMap || mat.metalnessMap || mat.emissiveMap || mat.specularMap) {
                        materialNeedsFixing = true;
                    }
                });
            }
            if (materialNeedsFixing) {
                console.warn(`发现不兼容的网格: ${object.name || ''}。几何体缺少 UV 坐标，但材质有纹理。将从材质上移除纹理以修复此问题。`);
                fixesApplied++;

                // 应用修复：移除所有纹理
                materials.forEach(mat => {
                    // 保存原始纹理名称以便调试
                    const originalMap = mat.map;
                    const originalNormalMap = mat.normalMap;
                    const originalRoughnessMap = mat.roughnessMap;
                    mat.map = null;
                    mat.normalMap = null;
                    mat.roughnessMap = null;
                    mat.metalnessMap = null;
                    mat.emissiveMap = null;
                    mat.specularMap = null;
                    mat.needsUpdate = true; // 重要：通知材质已更改
                    console.log(`  -> 已从材质中移除:`, {
                        baseColorTexture: originalMap ? originalMap.image.src || originalMap.uuid : 'N/A',
                        normalTexture: originalNormalMap ? originalNormalMap.image.src || originalNormalMap.uuid : 'N/A',
                        // 其他纹理...
                    });
                });
            }
        }
    });
    // --- 对顶点颜色的修复仍然有效，保留它 ---
    console.log("--- 清理顶点颜色数据 ---");
    let colorFixCount = 0;
    scene.traverse((object) => {
        if (object.isMesh && object.geometry) {
            if (object.geometry.attributes.color) {
                const colorArray = object.geometry.attributes.color.array;
                for (let i = 0; i < colorArray.length; i += 3) {
                    colorArray[i] = Math.min(Math.max(colorArray[i], 0), 1);
                    colorArray[i+1] = Math.min(Math.max(colorArray[i+1], 0), 1);
                    colorArray[i+2] = Math.min(Math.max(colorArray[i+2], 0), 1);
                }
                object.geometry.attributes.color.needsUpdate = true;
                colorFixCount++;
            }
        }
        if(object.isMaterial){
             if (object.color && object.color.r > 1) { object.color.r = 1; }
             if (object.color && object.color.g > 1) { object.color.g = 1; }
             if (object.color && object.color.b > 1) { object.color.b = 1; }
             if (object.emissive && object.emissive.r > 1) { object.emissive.r = 1; }
             // ... 同样处理 G, B
        }
    });
    console.log(`修复完成! 共应用了 ${fixesApplied} 个纹理修复，处理了 ${colorFixCount} 个顶点颜色属性。`);
}
export async function convertAndExport() {
    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput.files.length === 0) {
        alert("请先选择一个 JSON 文件！");
        return;
    }
    console.clear();
    const file = fileInput.files[0];
    const text = await file.text();
    const jsonData = JSON.parse(text);

    const objectLoader = new ObjectLoader();
    const model = objectLoader.parse(jsonData);

    const scene = new THREE.Scene();
    scene.add(model);
    // 调用更强大的修复函数
    fixSceneForGLTFExport(scene);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    const gltfExporter = new GLTFExporter();
    const options = { binary: true, onlyVisible: true, embedImages: true };
    gltfExporter.parse(
        scene,
        function (glb) {
            console.log("✅ GLTFExporter 回调触发。glb 是否存在:", !!glb);
            if (glb instanceof ArrayBuffer) {
                console.log("✅ 成功获得 ArrayBuffer，大小:", glb.byteLength, "bytes");
                const blob = new Blob([glb], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'model_converted_fixed_strong.glb';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                alert('✅ 强力修复版 GLB 文件已下载！请再次上传到 gltf.report 验证。');
            }
        },
        function (error) {
            console.error("GLTFExporter 抛出错误:", error);
        },
        options
    );
}
