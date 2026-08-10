"""Page Builder schema validation."""

def validate_builder_schema(schema: dict) -> list[str]:
    """Basic validation of the page document schema."""
    errors: list[str] = []

    if not isinstance(schema, dict):
        return ["Schema must be a JSON object."]

    if "schemaVersion" not in schema:
        errors.append("Missing 'schemaVersion'.")

    if "rootNodeId" not in schema:
        errors.append("Missing 'rootNodeId'.")

    nodes = schema.get("nodes")
    if not isinstance(nodes, dict):
        errors.append("'nodes' must be a JSON object.")
    else:
        root_id = schema.get("rootNodeId")
        if root_id and root_id not in nodes:
            errors.append(f"Root node '{root_id}' not found in nodes.")

        for node_id, node in nodes.items():
            if not isinstance(node, dict):
                errors.append(f"Node '{node_id}' must be a JSON object.")
                continue

            if node.get("id") != node_id:
                errors.append(f"Node '{node_id}': id mismatch (got '{node.get('id')}').")

            if not node.get("type"):
                errors.append(f"Node '{node_id}': missing 'type'.")

            # Check that slot references point to existing nodes
            slots = node.get("slots", {})
            if isinstance(slots, dict):
                for slot_name, children in slots.items():
                    if isinstance(children, list):
                        for child_id in children:
                            if child_id not in nodes:
                                errors.append(
                                    f"Node '{node_id}', slot '{slot_name}': "
                                    f"references non-existent node '{child_id}'."
                                )

    return errors
