extends Control

var ship: Node2D = null

func _process(delta):
	queue_redraw()

func _draw():
	if not is_instance_valid(ship): return

	# Draw Indicator
	# Fix: Use surface distance (dist - radius)
	var planets = get_tree().get_nodes_in_group("planets")
	var nearest = null
	var min_surface_dist = INF

	for p in planets:
		var dist = ship.global_position.distance_to(p.global_position)
		var surface_dist = dist - p.radius
		if surface_dist < min_surface_dist:
			min_surface_dist = surface_dist
			nearest = p

	# Center of screen (Player position relative to Camera)
	var center = get_viewport().get_visible_rect().size / 2

	if nearest and min_surface_dist > 10.0 and min_surface_dist < 2000.0:
		var dir = (nearest.global_position - ship.global_position).normalized()
		var offset = dir * 60.0 # Indicator radius

		draw_circle(center + offset, 4.0, Color.RED)
