import express from "express";
import { createClient } from "@supabase/supabase-js";
import { authenticateUser, requireRole } from "../middleware/auth.js";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../controllers/propertyController.js";

const router = express.Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Public routes
router.get("/", getProperties);
router.get("/:id", getPropertyById);

// Protected routes
router.post("/", authenticateUser, requireRole(["landlord"]), createProperty);
router.put("/:id", authenticateUser, requireRole(["landlord"]), updateProperty);
router.delete(
  "/:id",
  authenticateUser,
  requireRole(["landlord"]),
  deleteProperty
);

// Get all properties
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("properties").select("*");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single property
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new property
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a property
router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .update(req.body)
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    if (!data.length) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a property
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
