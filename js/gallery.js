const n_columns = 3;
const columns = [];
const col_width = 100 / n_columns;
const margin = 2.;
const sizes = [400, 600, 1000];
const IMG_INFO = fetch("/images.json").then(r => r.text());
const column_height = [];
for (var i = 0; i < n_columns; i++) {
    column_height.push(0.0);
    const e = document.createElement("div");
    e.style.width = col_width + "vw";
    columns.push(e);
}
function add_image(src, ar) {
    const img = new Image();
    img.src = src;
    const img_width = col_width - margin;
    const img_height = img_width * ar;
    img.style.height = img_height + "vw";
    img.style.width = img_width + "vw";
    let min_idx = 0;
    let min_height = column_height[0];
    for (const [i, h] of column_height.entries()) {
        if (h < min_height) {
            min_idx = i;
        }
    }
    columns[min_idx].appendChild(img);
    column_height[min_idx] += img.height + margin;
}
function select_size() {
    let size = sizes[0];
    const img_width = window.innerWidth * window.devicePixelRatio * (col_width - margin) / 100.;
    for (const s of sizes) {
        if (s < img_width) {
            size = s;
        }
    }
    return size;
}
async function init() {
    const container = document.createElement("div");
    container.classList.add("flow");
    document.body.appendChild(container);
    container.append(...columns);
    let img_info_text = await IMG_INFO;
    const images = JSON.parse(img_info_text);
    const size = select_size();
    let i = 0;
    function next() {
        if (i < images.length) {
            const [id, ar] = images[i];
            const id_str = String(id).padStart(5, "0");
            add_image(`/img/${size}/${id_str}.webp`, ar);
            setTimeout(next, 500);
            i += 1;
        }
    }
    setTimeout(next, 100);
}
if (document.readyState === 'complete') {
    init();
}
else {
    document.addEventListener("DOMContentLoaded", init);
}
//# sourceMappingURL=gallery.js.map