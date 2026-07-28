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

        this.position = {
            left: 24,
            top: 80
        };

        this.dragging = false;

        this.dragOffset = {
            x: 0,
            y: 0
        };

        this.isCollapsed = false;
        this.pendingFrame = false;

        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.renderDragFrame = this.renderDragFrame.bind(this);

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

            <div class="opn-navbar-heading">

                <button class="opn-drag-handle" type="button" title="Drag to move navbar">⋮⋮</button>

                <h3>📑 Page Navigation</h3>

            </div>

            <div class="opn-navbar-actions">

                <button class="opn-collapse-panel" type="button" title="Collapse or expand navbar">

                    ▾

                </button>

                <button class="opn-collapse-nav" type="button" title="Collapse navbar items">

                    Collapse Nav

                </button>

                <button class="opn-collapse-rows" type="button" title="Collapse VC rows">

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

        this.nav.style.position = "fixed";
        this.nav.style.left = "0";
        this.nav.style.top = "0";
        this.nav.style.willChange = "transform";
        this.nav.style.touchAction = "none";

        this.applyLayoutState();

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

        const dragHandle = this.nav.querySelector(".opn-drag-handle");

        if (dragHandle) {
            dragHandle.addEventListener("pointerdown", event => this.startDragging(event));
        }

        this.nav
            .querySelector(
                ".opn-collapse-nav"
            )
            .onclick = () => {
                this.state.collapseAll();
                this.render();
            };

        this.nav
            .querySelector(".opn-collapse-panel")
            .onclick = event => {
                event.preventDefault();
                this.togglePanel();
            };

        this.nav
            .querySelector(".opn-collapse-rows")
            .onclick = () => {

                const ids = this.tree
                    .flatten()
                    .map(model => model.id);


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

    applyLayoutState() {

        this.nav.style.left = "0";
        this.nav.style.top = "0";
        this.nav.style.transform = `translate3d(${this.position.left}px, ${this.position.top}px, 0)`;

        this.nav.classList.toggle("opn-navbar-collapsed", this.isCollapsed);

        const treeRoot = this.nav.querySelector(".opn-navbar-tree");

        if (treeRoot) {
            treeRoot.style.display = this.isCollapsed ? "none" : "";
        }

        const panelButton = this.nav.querySelector(".opn-collapse-panel");

        if (panelButton) {
            panelButton.textContent = this.isCollapsed ? "▸" : "▾";
            panelButton.title = this.isCollapsed ? "Expand navbar" : "Collapse navbar";
        }

        const headerTitle = this.nav.querySelector(".opn-navbar-header h3");

        if (headerTitle) {
            headerTitle.style.display = this.isCollapsed ? "none" : "";
        }

    }

    /*====================================================*/

    togglePanel() {

        this.isCollapsed = !this.isCollapsed;
        this.applyLayoutState();

    }

    /*====================================================*/

    startDragging(event) {

        event.preventDefault();

        this.dragging = true;
        this.dragOffset = {
            x: event.clientX - this.position.left,
            y: event.clientY - this.position.top
        };

        this.nav.classList.add("opn-navbar-dragging");

        document.addEventListener("pointermove", this.handlePointerMove);
        document.addEventListener("pointerup", this.handlePointerUp, { once: true });

    }

    /*====================================================*/

    handlePointerMove(event) {

        if (!this.dragging) {
            return;
        }

        const maxLeft = Math.max(0, window.innerWidth - this.nav.offsetWidth - 8);
        const maxTop = Math.max(0, window.innerHeight - this.nav.offsetHeight - 8);

        this.position.left = Math.min(maxLeft, Math.max(0, event.clientX - this.dragOffset.x));
        this.position.top = Math.min(maxTop, Math.max(0, event.clientY - this.dragOffset.y));

        if (!this.pendingFrame) {
            this.pendingFrame = true;
            requestAnimationFrame(this.renderDragFrame);
        }

    }

    /*====================================================*/

    renderDragFrame() {

        this.pendingFrame = false;
        this.nav.style.transform = `translate3d(${this.position.left}px, ${this.position.top}px, 0)`;

    }

    /*====================================================*/

    handlePointerUp() {

        this.dragging = false;
        this.pendingFrame = false;
        this.nav.classList.remove("opn-navbar-dragging");

        document.removeEventListener("pointermove", this.handlePointerMove);
        document.removeEventListener("pointerup", this.handlePointerUp);

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