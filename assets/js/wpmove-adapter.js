/*==========================================================
=
=   WpMoveAdapter
=
==========================================================*/

class WpMoveAdapter {

    constructor(vc, tree, bus) {

        this.vc = vc;
        this.tree = tree;
        this.bus = bus;

    }

    /*----------------------------------------------------*/

    move(session) {

        const sourceView =
            this.getView(session.model);

        const targetView =
            this.getView(session.target);

        if (!sourceView || !targetView)
            return false;

        const $source = sourceView.$el;
        const $target = targetView.$el;

        if (!$source || !$source.length || !$target || !$target.length)
            return false;

        console.log(session, $source, $target);
        

        const container =
            this.resolveContainer(
                $target,
                session.position
            );

        if (!container)
            return false;

        this.performDomMove(
            $source,
            $target,
            container,
            session.position
        );

        this.nativeSync(
            $source,
            container,
            session.position
        );

        this.bus.trigger("tree:changed");

        this.finish(session);

        return true;

    }

    /*----------------------------------------------------*/

    getView(model) {

        return this.vc.app.views[
            model.get("id")
        ];

    }

    /*----------------------------------------------------*/

    resolveContainer($target, position) {

        if (position !== "inside") {

            const parent = $target.parent();

            return parent.length
                ? parent
                : $target.closest(".wpb_column_container, #wpbakery_content");

        }

        let container =
            $target.children(".wpb_element_wrapper")
                .children(".wpb_column_container");

        if (container.length)
            return container;

        container =
            $target.find(".wpb_column_container")
                .first();

        if (container.length)
            return container;

        const fallback =
            $target.closest(".wpb_column_container");

        return fallback.length
            ? fallback
            : null;

    }

    /*----------------------------------------------------*/

    performDomMove(
        $source,
        $target,
        container,
        position
    ) {

        switch (position) {

            case "before":

                $target.before($source);

                break;

            case "after":

                $target.after($source);

                break;

            case "inside":

                container.append($source);

                break;

        }

    }

    /*----------------------------------------------------*/

    nativeSync(
        $source,
        $container,
        position
    ) {

        this.refreshSortable(
            $container
        );

        this.syncBackbone(
            $source,
            position
        );

        this.tree.rebuild();

    }


    syncBackbone($source, position) {

            const model =
                $source.data("model");

            if (!model)
                return;

            this.updateParent(model, position);

            this.updateSiblingOrders(
                model.get("parent_id")
            );

            this.vc.storage.save();

            this.tree.rebuild();

        }

    updateParent(model, position) {

        const view =
            this.getView(model);

        if (!view || !view.$el)
            return;

        const parent =
            view.$el
                .parent()
                .closest("[data-model-id]");

        const parentId =
            position === "inside"
                ? (parent.length ? parent.data("model")?.id : null)
                : (parent.length ? parent.data("model")?.id : null);

        model.save({

            parent_id: parentId || null

        }, {
            silent: true
        });

    }
    updateSiblingOrders(parentId) {

        let container = null;

        if (parentId) {

            const parentModel =
                this.tree.getModel(parentId);

            const parentView =
                parentModel
                    ? this.getView(parentModel)
                    : null;

            if (parentView && parentView.$el) {

                container =
                    parentView.$el
                        .children(".wpb_element_wrapper")
                        .children(".wpb_column_container");

                if (!container.length) {

                    container =
                        parentView.$el.find(".wpb_column_container")
                            .first();

                }

            }

        }

        if (!container || !container.length) {

            container =
                jQuery("#wpbakery_content");

        }

        container.children("[data-model-id]")
            .each(function(index){

                jQuery(this)
                    .data("model")
                    .save({

                        order:index

                    }, {
                        silent: true
                    });

            });

    }

    refreshSortable(container) {

        if (
            container &&
            container.data("ui-sortable")
        ) {

            container.sortable("refresh");

            container.sortable("refreshPositions");

        }

        this.vc.app.setSortable();

    }
    finish(session) {

        this.bus.trigger(
            "tree:changed"
        );

        this.bus.trigger(
            "selection:changed",
            session.model.id
        );

        this.bus.trigger(
            "scroll:reveal",
            session.model.id
        );

    }

}