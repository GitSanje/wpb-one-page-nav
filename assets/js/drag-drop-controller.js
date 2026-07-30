/**************************************************************************
 *
 * GhostManager
 * AutoScroller
 * DropResolver
 * DragSession
 *
 **************************************************************************/

/**
 * -------------------------------------------------------
 * DragSession
 * -------------------------------------------------------
 * Stores the complete state of one drag operation.
 *
 * A DragSession never manipulates WPBakery.
 * It only stores information.
 *
 */

class DragSession {

    constructor(sourceModel) {

        this.model = sourceModel;

        this.sourceId = sourceModel.id;

        this.target = null;

        this.position = "after";

        this.dragging = false;

        this.cancelled = false;

        this.started = false;

        this.startX = 0;
        this.startY = 0;

        this.currentX = 0;
        this.currentY = 0;

        this.offsetX = 16;
        this.offsetY = 16;

        this.ghost = null;

        this.expandTimer = null;

        this.scrollFrame = null;

        this.line = null;

    }

    begin(x, y) {

        this.started = true;

        this.startX = x;
        this.startY = y;

        this.currentX = x;
        this.currentY = y;

        this.dragging = false;

    }

    update(x, y) {

        this.currentX = x;
        this.currentY = y;

    }

    movement() {

        return Math.hypot(

            this.currentX - this.startX,

            this.currentY - this.startY

        );

    }

    shouldStart(x, y) {

        this.update(x, y);

        return this.movement() > 8;

    }

    updatePointer(x, y) {

        this.update(x, y);

    }

    clearTarget() {

        this.resetTarget();

    }

    resetTarget() {

        this.target = null;

        this.position = "after";

    }

    destroy() {

        clearTimeout(this.expandTimer);

        cancelAnimationFrame(this.scrollFrame);

        this.expandTimer = null;

        this.scrollFrame = null;

        this.target = null;

        this.ghost = null;

        this.line = null;

    }

}


/**
 * -------------------------------------------------------
 * GhostManager
 * -------------------------------------------------------
 *
 * Responsible ONLY for the drag preview.
 *
 * It never knows anything about Backbone,
 * WPBakery or sorting.
 *
 */

class GhostManager {

    constructor() {

        this.className = "opn-drag-ghost";

    }

    create(session) {

        if (session.ghost)
            return session.ghost;

        const ghost = document.createElement("div");

        ghost.className = this.className;

        ghost.innerHTML = `

            <span class="opn-drag-icon">

                ☰

            </span>

            <span class="opn-drag-label">

                ${this.getLabel(session.model)}

            </span>

        `;

        ghost.style.position = "fixed";

        ghost.style.pointerEvents = "none";

        ghost.style.zIndex = "999999";

        ghost.style.left = "-9999px";

        ghost.style.top = "-9999px";

        document.body.appendChild(ghost);

        session.ghost = ghost;

        return ghost;

    }

    move(session) {

        if (!session.ghost)
            return;

        session.ghost.style.left =

            `${session.currentX + session.offsetX}px`;

        session.ghost.style.top =

            `${session.currentY + session.offsetY}px`;

    }

    destroy(session) {

        if (!session.ghost)
            return;

        session.ghost.remove();

        session.ghost = null;

    }

    getLabel(model) {

        const params = model.get("params") || {};

        return (

            params.nav_label ||

            params.title ||

            model.get("shortcode")

        );

    }

}


/**
 * -------------------------------------------------------
 * AutoScroller
 * -------------------------------------------------------
 *
 * Scrolls ONLY the sidebar.
 *
 */

class AutoScroller {

    constructor(container) {

        this.container = container;
        this.threshold = 50;

        this.maxSpeed = 18;

    }

    update(session) {

        if (!this.container || typeof this.container.getBoundingClientRect !== "function") {
            return;
        }

        const rect =
            this.container.getBoundingClientRect();

        if (!rect || !Number.isFinite(rect.top) || !Number.isFinite(rect.bottom)) {
            return;
        }

        const maxScrollTop = Math.max(0, this.container.scrollHeight - this.container.clientHeight);

        if (maxScrollTop <= 0) {
            return;
        }

        let speed = 0;

        if (

            session.currentY <

            rect.top + this.threshold

        ) {

            speed =

                -this.computeSpeed(

                    rect.top +

                    this.threshold -

                    session.currentY

                );

        }

        else if (

            session.currentY >

            rect.bottom -

            this.threshold

        ) {

            speed =

                this.computeSpeed(

                    session.currentY -

                    (

                        rect.bottom -

                        this.threshold

                    )

                );

        }

        if (speed === 0)
            return;

        const nextScrollTop = this.container.scrollTop + speed;

        this.container.scrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));

    }

    computeSpeed(distance) {

        return Math.min(

            this.maxSpeed,

            Math.ceil(distance / 4)

        );

    }

}


/**
 * -------------------------------------------------------
 * DropResolver
 * -------------------------------------------------------
 *
 * Converts mouse coordinates
 * into
 *
 * target model
 * +
 * before / inside / after
 *
 * No DOM mutation happens here.
 *
 */

class DropResolver {

    constructor(tree) {

        this.tree = tree;

        this.topRatio = .25;

        this.bottomRatio = .75;

    }

    resolve(event, sourceId) {

        const row =

            document

                .elementFromPoint(
                    event.clientX,
                    event.clientY
                )
                ?.closest(

                    ".opn-tree-node"

                );

        if (!row)
            return null;

        const model =

            this.tree.getModel(
                row.dataset.id
            );

        if (!model)
            return null;

        if (model.id === sourceId)
            return null;

        return {

            model,

            element: row,

            position: this.resolvePosition(
                row,
                event
            )

        };

    }

    resolvePosition(node, event) {

        const rect =

            node.getBoundingClientRect();

        const y =

            event.clientY - rect.top;

        const ratio =

            y / rect.height;

        if (ratio < this.topRatio)
            return "before";

        if (ratio > this.bottomRatio)
            return "after";

        return "inside";

    }

    drawIndicator(session, target) {

        if (!session.line)
            return;

        const rect =

            target.element.getBoundingClientRect();

        const line =

            session.line;

        line.style.display = "block";

        line.style.left =

            `${rect.left}px`;

        line.style.width =

            `${rect.width}px`;

        switch (target.position) {

            case "before":

                line.style.top =

                    `${rect.top}px`;

                break;

            case "after":

                line.style.top =

                    `${rect.bottom}px`;

                break;

            case "inside":

                line.style.top =

                    `${

                        rect.top +

                        rect.height / 2

                    }px`;

                break;

        }

    }

    hideIndicator(session) {

        if (!session.line)
            return;

        session.line.style.display = "none";

    }

    createIndicator(session) {

        if (session.line)
            return;

        const line =

            document.createElement("div");

        line.className =

            "opn-insert-line";

        document.body.appendChild(line);

        session.line = line;

    }

    destroyIndicator(session) {

        if (!session.line)
            return;

        session.line.remove();

        session.line = null;

    }

}