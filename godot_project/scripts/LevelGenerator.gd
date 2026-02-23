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

			var depth = -chunk.y * GameConfig.CHUNK_SIZE
			p.type = pick_random_type(depth)

			# Override for Star logic
			if depth > 20000.0 and randf() < 0.05:
				p.type = "star"
				p.radius = GameConfig.MAX_PLANET_RADIUS # Force max radius

			parent.call_deferred("add_child", p)
			planets_in_chunk.append(p)

	# Asteroid Clusters (100+ LY)
	var chunk_depth = -chunk.y * GameConfig.CHUNK_SIZE
	if chunk_depth > 10000.0:
		if randf() < 0.4:
			var cluster_count = randi_range(3, 8)
			var cluster_center = Vector2(
				(chunk.x * GameConfig.CHUNK_SIZE) + randf() * GameConfig.CHUNK_SIZE,
				(chunk.y * GameConfig.CHUNK_SIZE) + randf() * GameConfig.CHUNK_SIZE
			)

			for k in range(cluster_count):
				var off = Vector2(randf() - 0.5, randf() - 0.5) * 200.0
				var apos = cluster_center + off
				var arad = randf_range(10.0, 20.0)

				# Check collision with planets (but not other asteroids)
				var a_valid = true
				for p in planets_in_chunk:
					if apos.distance_to(p.position) < (arad + p.radius + 50.0):
						a_valid = false; break

				if a_valid:
					var ast = planet_scene.instantiate()
					ast.position = apos
					ast.radius = arad
					ast.type = "asteroid"
					parent.call_deferred("add_child", ast)

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

func pick_random_type(depth: float) -> String:
	var types = ["dead", "ocean", "ice", "desert", "gas_giant", "black_hole"]

	if depth < 5000.0:
		types.erase("black_hole")

	return types[randi() % types.size()]
