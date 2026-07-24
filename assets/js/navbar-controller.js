class Navbar {

    constructor(
        tree,
        state,
        bus
    ) {

        this.tree = tree;

        this.state = state;

        this.bus = bus;

        this.nodeMap = new Map();

        this.nav = document.createElement("aside");

        this.nav.className =
            "opn-custom-navbar";

    }

    /*====================================================*/

    init() {
        this.createLayout();
        this.bindEvents();
        this.render();
    }

    /*====================================================*/

    createLayout() {

        this.nav.innerHTML = "";

        const header =
            document.createElement("header");

        header.className =
            "opn-navbar-header";

        header.innerHTML = `

            <h3>📑 Page Navigation</h3>

            <div class="opn-navbar-actions">

                <button class="opn-collapse-nav" title="Collapse navbar items">

                    Collapse Nav

                </button>

                <button class="opn-collapse-rows" title="Collapse VC rows">

                    Collapse Rows

                </button>

            </div>

        `;

        this.treeRoot =
            document.createElement("div");

        this.treeRoot.className =
            "opn-navbar-tree";

        this.nav.append(

            header,

            this.treeRoot

        );

        document.body.appendChild(

            this.nav

        );

    }

    /*====================================================*/

    bindEvents() {

        this.bus.on(

            "tree:changed",

            () => {

                this.render();

            }

        );

        this.bus.on(

            "selection:changed",

            id => {

                this.highlight(id);

            }

        );

        this.bus.on(

            "scroll:reveal",

            id => {

                const node = this.getNode(id);

                if (!node)
                    return;

                SidebarUtils.scrollIntoView(node.row);

            }

        );

        this.nav
            .querySelector(
                ".opn-collapse-nav"
            )
            .onclick = () => {
                this.state.collapseAll();
                this.render();
            };

        this.nav
    .querySelector(".opn-collapse-rows")
    .onclick = () => {

        const ids = this.tree
            .flatten()
            .map(model => model.id);

        // this.state.collapseAllRows(ids);

        ids.forEach(id => {

            const view = vc.app.views[id];

            if (!view) {
                return;
            }

            if (view.model.get("shortcode") !== "vc_row") {
                return;
            }

            view.$el.addClass("vc_collapsed-row");

        });

        this.render();

    };

    }

    /*====================================================*/

    render() {

        this.treeRoot.innerHTML = "";

        this.nodeMap.clear();

        this.tree
            .getChildren(null)
            .forEach(model => {
                const node =
                    this.createNode(model);
                this.treeRoot.appendChild(
                    node.el
                );

            });

        this.syncEditorState();

    }

    /*====================================================*/

    createNode(model) {

        const node =
            new TreeNodeView(

                model,

                this.tree,

                this.state,

                this.bus,

                this

            );

        node.render();

        this.nodeMap.set(
            String(model.id),
            node
        );

        return node;

    }

    /*====================================================*/

    getNode(id) {

        return this.nodeMap.get(

            String(id)

        );

    }

    /*====================================================*/

    highlight(id) {

        const resolvedId =
            id && typeof id === "object"
                ? id.id
                : id;

        this.nav

            .querySelectorAll(

                ".is-selected"

            )

            .forEach(el =>

                el.classList.remove(

                    "is-selected"

                )

            );

        const node =
            this.getNode(resolvedId);

        if (!node)
            return;

        node.row.classList.add(

            "is-selected"

        );

        this.syncEditorSelection(resolvedId);

        SidebarUtils.scrollIntoView(

            node.row

        );

    }

    syncEditorState() {

        const rows = Array.from(
            document.querySelectorAll(
                '[data-model-id][data-element_type="vc_row"]'
            )
        );

        rows.forEach(row => {

            const id = row.dataset.modelId;

            if (!id)
                return;

            const isCollapsed = this.state.isCollapsed(id);

            row.classList.toggle("opn-row-collapsed", isCollapsed);

            const wrappers = row.querySelectorAll(
                ".wpb_element_wrapper, .wpb_column_container, .wpb_vc_column_inner"
            );

            wrappers.forEach(wrapper => {

                wrapper.style.display = isCollapsed ? "none" : "";

            });

            const controls = row.querySelector(
                ".vc_controls"
            );

            if (controls) {

                controls.style.display = isCollapsed ? "none" : "";

            }

            const header = row.querySelector(
                ".vc_row-hash-id"
            );

            if (header) {

                header.style.display = isCollapsed ? "none" : "";

            }

        });

    }

    highlight(id) {

        const resolvedId =
            id && typeof id === "object"
                ? id.id
                : id;

        this.nav

            .querySelectorAll(

                ".is-selected"

            )

            .forEach(el =>

                el.classList.remove(

                    "is-selected"

                )

            );

        const node =
            this.getNode(resolvedId);

        if (!node)
            return;

        node.row.classList.add(
            "is-selected"
        );

        this.syncEditorSelection(resolvedId);

        SidebarUtils.scrollIntoView(
            node.row

        );

    }

    syncEditorSelection(id) {

        const row = document.querySelector(
            `[data-model-id="${id}"][data-element_type="vc_row"]`
        );

        if (!row)
            return;

        document.querySelectorAll(
            '[data-model-id][data-element_type="vc_row"].opn-row-active'
        ).forEach(el => {

            el.classList.remove("opn-row-active");

        });

        row.classList.add("opn-row-active");

        if (typeof row.scrollIntoView === "function") {
            row.scrollIntoView({ block: "center", behavior: "smooth" });
        }

    }

}



class TreeNodeView {

    constructor(

        model,

        tree,

        state,

        bus,

        navbar

    ) {

        this.model = model;

        this.tree = tree;

        this.state = state;

        this.bus = bus;

        this.navbar = navbar;

        this.childrenViews = [];

       this.el =
            document.createElement("div");

        this.el.className =
            "opn-tree-item"; 

    }

    /*====================================================*/

    render() {

        this.el.innerHTML = "";

        this.row =
            document.createElement("div");

        this.row.className =
            "opn-tree-node";

        this.row.dataset.id =
            this.model.id;

        this.row.append(

            this.buildToggle(),

            this.buildIcon(),

            this.buildLabel()

        );

        this.el.appendChild(
            this.row
        );

        this.renderChildren();

    }

    /*====================================================*/

    buildToggle() {

        const btn =
            document.createElement("button");

        btn.className =
            "opn-tree-toggle";

        const hasChildren =
            this.tree.hasChildren(
                this.model.id
            );

        if (!hasChildren) {

            btn.classList.add(
                "is-empty"
            );

            btn.textContent = "";
            return btn;

        }

        btn.textContent =
            this.state.isExpanded(
                this.model.id
            )

                ? "▼"
                : "▶";

        btn.onclick = e => {

            e.stopPropagation();
            this.state.toggle(
                this.model.id
            );
          this.navbar.render();

        };

        return btn;

    }

    /*====================================================*/

    buildIcon() {

        const img =
            document.createElement("img");

        img.className =
            "opn-nav-icon";

        img.src =
            wpbOnePageNav.plugin_url +

            "assets/imgs/element-icon-row.svg";

        return img;

    }

    /*====================================================*/

    buildLabel() {

        const span =
            document.createElement("span");

        span.className =
            "opn-tree-label";

        const params =
            this.model.get("params") || {};

        span.textContent =

            params.nav_label ||

            this.model.get("shortcode");

        span.onclick = () => {

            this.state.select(
                this.model.id
            );

            this.bus.trigger(

                "selection:changed",

                this.model.id

            );

            this.bus.trigger(
                "node:selected",
                this.model
            );

        };

        return span;

    }

    /*====================================================*/

    renderChildren() {

        if (

            !this.tree.hasChildren(
                this.model.id
            )
        ) {
            return;
        }
        if (

            !this.state.isExpanded(
                this.model.id
            )
        ) {

            return;

        }

        const container =
            document.createElement("div");

        container.className =
            "opn-tree-children";

        if (this.state.isExpanded(this.model.id)) {

            container.classList.add("is-expanded");

        } else {
            container.classList.remove("is-expanded");
        }

        this.tree

            .getChildren(
                this.model.id
            )

            .forEach(child => {

                const node =
                    this.navbar

                    .createNode(child);

                container.appendChild(

                    node.el

                );

            });

        this.el.appendChild(

            container

        );

    }

}