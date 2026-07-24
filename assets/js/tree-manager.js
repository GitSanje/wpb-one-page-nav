/*=========================================================
=
=  Event Bus
=
=========================================================*/

class EventBus {

    constructor() {

        _.extend(this, Backbone.Events);

    }

}

const bus = window.__opnBus || (window.__opnBus = new EventBus());


/*=========================================================
=
=  Sidebar State
=
=========================================================*/

class SidebarState {

    constructor() {

        this.expanded = new Set();

        this.collapsed = new Set();

        this.selected = null;

        this.scrollTop = 0;

        this.dragSession = null;

    }

    /*-----------------------*/

    isExpanded(id) {

        return this.expanded.has(String(id));

    }

    expand(id) {

        this.expanded.add(String(id));

    }

    collapse(id) {

        this.expanded.delete(String(id));

    }

    toggle(id) {

        id = String(id);

        this.expanded.has(id)
            ? this.expanded.delete(id)
            : this.expanded.add(id);

    }

    collapseAll() {

        this.expanded.clear();

    }

    isCollapsed(id) {

        return this.collapsed.has(String(id));

    }

    toggleCollapsed(id) {

        id = String(id);

        this.collapsed.has(id)
            ? this.collapsed.delete(id)
            : this.collapsed.add(id);

    }

    collapseAllRows(ids = []) {

        this.collapsed.clear();

        ids.forEach(id => {
            this.collapsed.add(String(id));
        });

    }

    expandAllRows(ids = []) {

        this.collapsed.clear();

        ids.forEach(id => {

            this.collapsed.delete(String(id));

        });

    }

    expandAll(ids) {

        ids.forEach(id => {

            this.expanded.add(String(id));

        });

    }

    /*-----------------------*/

    select(id) {

        this.selected = String(id);

    }

    deselect() {

        this.selected = null;

    }

}


/*=========================================================
=
=  Tree Repository
=
=========================================================*/

class TreeRepository {

    constructor(vc) {

        this.vc = vc;

        this.models = new Map();

        this.children = new Map();

        this.roots = [];

        this.rebuild();

    }

    /*=====================================================*/

    rebuild() {

        this.models.clear();

        this.children.clear();

        this.roots.length = 0;

        this.vc.shortcodes.each(model => {

            this.models.set(
                String(model.id),
                model
            );

        });

        this.models.forEach(model => {

            const parentId = model.get("parent_id");

            if (!parentId) {

                this.roots.push(model);

                return;

            }

            const key = String(parentId);

            if (!this.children.has(key)) {

                this.children.set(
                    key,
                    []
                );

            }

            this.children
                .get(key)
                .push(model);

        });

        this.roots.sort(
            this.sortModels
        );

        this.children.forEach(list => {

            list.sort(
                this.sortModels
            );

        });

    }

    /*=====================================================*/

    sortModels(a, b) {

        return (

            (a.get("order") || 0)

            -

            (b.get("order") || 0)

        );

    }

    /*=====================================================*/

    getModel(id) {

        return this.models.get(
            String(id)
        );

    }

    getParent(model) {

        if (!model)
            return null;

        return this.getModel(

            model.get("parent_id")

        );

    }

    getChildren(parentId = null) {

        if (parentId == null) {

            return this.roots;

        }

        return (

            this.children.get(

                String(parentId)

            )

            ||

            []

        );

    }

    hasChildren(id) {

        return this.getChildren(id)

            .length > 0;

    }

    isDescendant(sourceId, targetId) {

        let current =

            this.getModel(targetId);

        while (current) {

            if (

                current.get("parent_id")

                == sourceId

            ) {

                return true;

            }

            current =

                this.getParent(current);

        }

        return false;

    }

    flatten() {

        const out = [];

        const walk = parent => {

            this.getChildren(parent)

                .forEach(model => {

                    out.push(model);

                    walk(model.id);

                });

        };

        walk(null);

        return out;

    }

}


/*=========================================================
=
=  Utilities
=
=========================================================*/

class SidebarUtils {

    static getView(model) {

        return vc.app.views[

            model.get("id")

        ];

    }

    static getElement(model) {

        return this.getView(model)

            ?.$el?.[0]

            ||

            null;

    }

    static scrollIntoView(el) {

        if (!el)
            return;

        el.scrollIntoView({

            block: "nearest",

            behavior: "smooth"

        });

    }

    static debounce(fn, delay = 50) {

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(

                () => fn(...args),

                delay

            );

        };

    }

    static raf(fn) {

        return requestAnimationFrame(fn);

    }

}