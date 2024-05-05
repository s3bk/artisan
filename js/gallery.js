const sizes = [400, 600, 1000];
const IMG_LIST = fetch("images.json").then(r => r.text()).then(t => JSON.parse(t));
const ITEM_INFO = fetch("info.json").then(r => r.text()).then(t => JSON.parse(t));
const VIEW = { tag_filter: [] };
window.addEventListener("popstate", (event) => {
    if (event.state.tag_filter !== undefined) {
        VIEW.tag_filter = event.state.tag_filter;
        update();
    }
});
function push_state() {
    let s = "";
    if (VIEW.tag_filter.length > 0) {
        s += "?tag=" + VIEW.tag_filter.join(",");
    }
    history.pushState(VIEW, null, s);
}
function restore_state(focus) {
    if (location.search.startsWith("?")) {
        const [_, qargs] = location.search.split("?");
        for (const q of qargs.split("&")) {
            const [key, val] = q.split("=");
            if (key == "tag") {
                VIEW.tag_filter = val.split(",");
            }
        }
    }
    if (location.hash.length > 0) {
        const id = location.hash.split("#")[1];
        focus(id);
    }
}
function add_tag_filter(tag) {
    if (!VIEW.tag_filter.find(t => t == tag)) {
        VIEW.tag_filter.push(tag);
        push_state();
        update();
    }
}
function remove_tag_filter(tag) {
    const idx = VIEW.tag_filter.findIndex(t => t == tag);
    if (idx >= 0) {
        VIEW.tag_filter.splice(idx, 1);
        push_state();
        update();
    }
}
let update;
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
function img_url(id, size) {
    return `img/${size}/${id}.webp`;
}
function add_item(config, id, size, ar, info) {
    const src = img_url(id, size);
    const item = elem("div", { class: "item" });
    const img = new Image();
    img.loading = "lazy";
    img.src = src;
    const img_width = config.col_width - config.margin;
    const img_height = img_width * ar;
    img.style.height = img_height + "vw";
    img.style.width = img_width + "vw";
    let min_idx = -1;
    let min_height = Infinity;
    for (const [i, col] of config.columns.entries()) {
        if (col.height < min_height) {
            min_idx = i;
            min_height = col.height;
        }
    }
    item.appendChild(img);
    const info_div = elem("div", { class: "info" });
    let info_list = [["ID", id]];
    function add(val, f) {
        if (val !== undefined) {
            info_list.push(f(val));
        }
    }
    add(info.price_EUR, eur => ["Price", `${eur} €`]);
    add(info.size_cm, size => ["Size", size.map(cm => `${cm}cm`).join(" by ")]);
    info_div.appendChild(table(info_list));
    item.appendChild(info_div);
    if (info?.tags !== undefined) {
        item.appendChild(tag_list(info.tags, "🔍", add_tag_filter));
    }
    const col = config.columns[min_idx];
    col.elem.appendChild(item);
    col.height += img_height + config.margin;
    item.addEventListener("click", e => {
        if (e.target == img) {
            show_fullscreen(id, info);
        }
    });
}
function tag_list(tags, icon, callback) {
    const tag_list = document.createElement("div");
    tag_list.classList.add("tags");
    for (const tag of tags) {
        const parts = tag.split(":");
        const e = elem("div", null, elem("span", { class: "name" }, parts[parts.length - 1]), elem("span", { class: "action" }, icon));
        tag_list.appendChild(e);
        e.addEventListener("click", e => {
            e.stopImmediatePropagation();
            callback(tag);
        });
    }
    return tag_list;
}
function show_fullscreen(id, info) {
    const img = new Image();
    img.src = img_url(id, String(sizes[sizes.length - 1]));
    const div = document.createElement("div");
    history.pushState(id, null, "#" + id);
    const kd_listener = function (e) {
        if (e.key == "Escape") {
            close();
        }
    };
    function close() {
        window.removeEventListener("keydown", kd_listener);
        window.removeEventListener("click", close);
        div.remove();
        history.back();
    }
    img.onload = function () {
        div.classList.add("fullscreen");
        div.appendChild(img);
        if (info.tags !== undefined) {
            div.appendChild(tag_list(info.tags, "🔍", tag => {
                close();
                add_tag_filter(tag);
            }));
        }
        window.addEventListener("keydown", kd_listener);
        window.addEventListener("click", close);
        document.body.appendChild(div);
    };
}
function select_columns() {
    const n_columns = Math.min(Math.floor(window.innerWidth / 400), 4);
    const columns = [];
    const col_width = 100 / n_columns;
    const margin = 2.;
    for (var i = 0; i < n_columns; i++) {
        const e = document.createElement("div");
        e.style.width = col_width + "vw";
        columns.push({ elem: e, height: 0.0 });
    }
    return {
        n_columns,
        columns,
        col_width,
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
    const tag_search = document.createElement("div");
    tag_search.classList.add("tag-search");
    document.querySelector("header").appendChild(tag_search);
    const header = document.querySelector("header");
    let search_detached = false;
    window.addEventListener("scroll", e => {
        const d = header.getBoundingClientRect().bottom <= tag_search.getBoundingClientRect().height;
        if (d != search_detached) {
            if (d) {
                tag_search.classList.add("floating");
            }
            else {
                tag_search.classList.remove("floating");
            }
            search_detached = d;
        }
    });
    const container = document.createElement("div");
    container.classList.add("flow");
    document.body.appendChild(container);
    const config = select_columns();
    const size = select_size(config);
    container.append(...config.columns.map(c => c.elem));
    const item_list = await IMG_LIST;
    const item_info = new Map(Object.entries(await ITEM_INFO));
    restore_state(id => show_fullscreen(id, item_info.get(id) ?? {}));
    update = function () {
        for (const col of config.columns) {
            col.elem.replaceChildren(...[]);
            col.height = 0.0;
        }
        tag_search.replaceChildren(tag_list(VIEW.tag_filter, "−", remove_tag_filter));
        for (const [id, ar] of item_list) {
            const info = item_info.get(id) ?? {};
            let show = true;
            for (const tag of VIEW.tag_filter) {
                if ((info.tags === undefined) || (!info.tags.find(t => t == tag))) {
                    show = false;
                    break;
                }
            }
            if (show) {
                add_item(config, id, size, ar, info);
            }
        }
    };
    push_state();
    update();
}
if (document.readyState === 'complete') {
    init();
}
else {
    document.addEventListener("DOMContentLoaded", init);
}
export function elem(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
            e.setAttribute(key, value);
        }
    }
    for (const c of children) {
        if (typeof (c) == "string") {
            e.appendChild(document.createTextNode(c));
        }
        else {
            e.appendChild(c);
        }
    }
    return e;
}
//# sourceMappingURL=gallery.js.map