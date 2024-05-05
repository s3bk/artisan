const sizes = [400, 600, 1000];
const IMG_LIST = fetch("images.json").then(r => r.text()).then(t => JSON.parse(t));
const ITEM_INFO = fetch("info.json").then(r => r.text()).then(t => JSON.parse(t));
function table(rows) {
    const table = document.createElement("table");
    for (const row of rows) {
        const tr = document.createElement("tr");
        for (const val of row) {
            const td = document.createElement("td");
            td.innerText = val;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    return table;
}
function add_item(config, id, size, ar, info) {
    const src = `img/${size}/${id}.webp`;
    const item = document.createElement("div");
    item.classList.add("item");
    const img = new Image();
    img.loading = "lazy";
    img.src = src;
    const img_width = config.col_width - config.margin;
    const img_height = img_width * ar;
    img.style.height = img_height + "vw";
    img.style.width = img_width + "vw";
    let min_idx = 0;
    let min_height = config.column_height[0];
    for (const [i, h] of config.column_height.entries()) {
        if (h < min_height) {
            min_idx = i;
        }
    }
    item.appendChild(img);
    const info_div = document.createElement("div");
    info_div.classList.add("info");
    let info_list = [["ID", id]];
    if (info !== undefined) {
        function add(val, f) {
            if (val !== undefined) {
                info_list.push(f(val));
            }
        }
        add(info.price_EUR, eur => ["Price", `${eur} €`]);
        add(info.size_cm, size => ["Size", size.map(cm => `${cm}cm`).join(" by ")]);
    }
    info_div.appendChild(table(info_list));
    item.appendChild(info_div);
    config.columns[min_idx].appendChild(item);
    config.column_height[min_idx] += img.height + config.margin;
    item.addEventListener("click", e => {
        window.location.hash = id;
    });
}
function select_columns() {
    const n_columns = Math.min(Math.floor(window.innerWidth / 400), 4);
    const columns = [];
    const col_width = 100 / n_columns;
    const margin = 2.;
    const column_height = [];
    for (var i = 0; i < n_columns; i++) {
        column_height.push(0.0);
        const e = document.createElement("div");
        e.style.width = col_width + "vw";
        columns.push(e);
    }
    return {
        n_columns,
        columns,
        col_width,
        column_height,
        margin
    };
}
function select_size(config) {
    let size = sizes[0];
    const img_width = window.innerWidth * window.devicePixelRatio * (config.col_width - config.margin) / 100.;
    for (const s of sizes) {
        if (s < img_width) {
            size = s;
        }
    }
    return String(size);
}
async function init() {
    const container = document.createElement("div");
    container.classList.add("flow");
    document.body.appendChild(container);
    const config = select_columns();
    const size = select_size(config);
    container.append(...config.columns);
    const item_list = await IMG_LIST;
    const item_info = new Map(Object.entries(await ITEM_INFO));
    for (const [id, ar] of item_list) {
        add_item(config, id, size, ar, item_info.get(id));
    }
}
if (document.readyState === 'complete') {
    init();
}
else {
    document.addEventListener("DOMContentLoaded", init);
}
//# sourceMappingURL=gallery.js.map