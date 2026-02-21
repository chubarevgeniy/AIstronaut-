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
		if body.max_fuel != INF:
			body.fuel = min(body.max_fuel, body.fuel + amount)
		queue_free()

func _draw():
	# Green glow
	draw_circle(Vector2.ZERO, radius, Color(0, 1, 0, 0.6))
	draw_arc(Vector2.ZERO, radius, 0, TAU, 16, Color.WHITE, 1.0)

	# Label (Optional, simplistic)
	# draw_string(ThemeDB.fallback_font, Vector2(-10, 5), "F")
