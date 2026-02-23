extends Area2D
class_name FuelItem

@export var radius: float = 30.0 # Increased size as requested
@export var amount: float = 50.0

func _ready():
	add_to_group("fuel")
	body_entered.connect(_on_body_entered)
	queue_redraw()

func _on_body_entered(body):
	if body.is_in_group("player"):
		if body.has_method("add_fuel"):
			body.add_fuel(amount)
		elif body.max_fuel != INF:
			# Fallback if method missing (should not happen)
			body.fuel = min(body.max_fuel, body.fuel + amount)
		queue_free()

func _draw():
	# Green glow (keep it so player sees it)
	draw_circle(Vector2.ZERO, radius, Color(0, 1, 0, 0.3))

	# Crashed Ship Model (Jagged shape)
	var points = PackedVector2Array([
		Vector2(0, -20),   # Nose
		Vector2(-10, -5),  # Left crack
		Vector2(-15, 10),  # Left Wing tip
		Vector2(-5, 5),    # Broken part
		Vector2(5, 15),    # Right debris
		Vector2(15, 10),   # Right Wing tip
		Vector2(10, -5)    # Right crack
	])
	draw_colored_polygon(points, Color(0.6, 0.6, 0.6)) # Gray body
	draw_polyline(points, Color.WHITE, 2.0) # Outline
