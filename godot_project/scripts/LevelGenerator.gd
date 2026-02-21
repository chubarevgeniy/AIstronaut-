extends Node
class_name LevelGenerator

var visited_chunks: Dictionary = {}
var last_fuel_spawn_y: float = 0.0

func reset():
	visited_chunks.clear()
	last_fuel_spawn_y = 0.0

func generate_chunks(ship_pos: Vector2, parent_node: Node, planet_scene: PackedScene):
	var cx = floor(ship_pos.x / GameConfig.CHUNK_SIZE)
	var cy = floor(ship_pos.y / GameConfig.CHUNK_SIZE)

	for dx in range(-1, 2):
		for dy in range(-1, 2):
			var chunk_coord = Vector2i(cx + dx, cy + dy)
			if not visited_chunks.has(chunk_coord):
				visited_chunks[chunk_coord] = true
				spawn_planets_in_chunk(chunk_coord, parent_node, planet_scene)

func spawn_planets_in_chunk(chunk: Vector2i, parent: Node, planet_scene: PackedScene):
	var count = randi_range(GameConfig.MIN_PLANETS_PER_CHUNK, GameConfig.MAX_PLANETS_PER_CHUNK)
	var planets_in_chunk = []

	for i in range(count):
		var valid = false
		var attempts = 0
		var pos = Vector2.ZERO
		var rad = 0.0

		while not valid and attempts < 10:
			attempts += 1
			pos = Vector2(
				(chunk.x * GameConfig.CHUNK_SIZE) + randf() * GameConfig.CHUNK_SIZE,
				(chunk.y * GameConfig.CHUNK_SIZE) + randf() * GameConfig.CHUNK_SIZE
			)
			rad = randf_range(GameConfig.MIN_PLANET_RADIUS, GameConfig.MAX_PLANET_RADIUS)

			# Start area safety (0,0)
			if chunk == Vector2i.ZERO and pos.length() < 350.0:
				continue

			valid = true
			# Check against other new planets
			for p in planets_in_chunk:
				if pos.distance_to(p.position) < (rad + p.radius + 100.0):
					valid = false; break

		if valid:
			var p = planet_scene.instantiate()
			p.position = pos
			p.radius = rad
			p.type = pick_random_type()
			parent.call_deferred("add_child", p)
			planets_in_chunk.append(p)

func generate_items(ship_y: float, parent: Node, item_scene: PackedScene):
	# ship_y is negative going up
	if ship_y < last_fuel_spawn_y - GameConfig.FUEL_SPAWN_INTERVAL:
		last_fuel_spawn_y -= GameConfig.FUEL_SPAWN_INTERVAL

		if randf() < 0.9:
			var item = item_scene.instantiate()
			var x_offset = (randf() - 0.5) * GameConfig.CHUNK_SIZE * 3.0
			item.position = Vector2(x_offset, last_fuel_spawn_y - randf() * 1000.0)
			parent.call_deferred("add_child", item)

func cleanup(ship_pos: Vector2, parent: Node):
	var limit = 3000.0 * 3000.0
	for child in parent.get_children():
		if child.is_in_group("planets") or child.is_in_group("fuel"):
			if child.global_position.distance_squared_to(ship_pos) > limit:
				child.queue_free()

func pick_random_type() -> String:
	var types = ["dead", "ocean", "ice", "desert", "gas_giant", "black_hole"]
	return types[randi() % types.size()]
