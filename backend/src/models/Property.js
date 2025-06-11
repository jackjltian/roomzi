import { supabase } from "../config/supabase.js";

export class Property {
  static async findAll({ page = 1, limit = 10, filters = {}, sort = {} }) {
    try {
      let query = supabase.from("properties").select("*", { count: "exact" });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query = query.eq(key, value);
      });

      // Apply sorting
      if (sort.field) {
        query = query.order(sort.field, { ascending: sort.ascending ?? true });
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return { data, count };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async create(propertyData) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, propertyData) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .update(propertyData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw error;
    }
  }
}
