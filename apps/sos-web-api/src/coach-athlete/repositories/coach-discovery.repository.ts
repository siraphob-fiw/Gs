import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CoachDiscoveryProfile,
  CreateCoachDiscoveryProfileRequest,
  UpdateCoachDiscoveryProfileRequest,
} from '../entities/coach-athlete-relationship.entity';
import { CoachDiscoveryFilters } from '../services/coach-discovery.service';

@Injectable()
export class CoachDiscoveryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private get knex() {
    return this.databaseService.knex;
  }

  async create(
    coachId: string,
    tenantId: string,
    data: CreateCoachDiscoveryProfileRequest,
  ): Promise<CoachDiscoveryProfile> {
    // Check if a profile already exists for this coach and tenant
    const existing = await this.knex('coach_discovery_profiles')
      .where({ coach_id: coachId, tenant_id: tenantId })
      .first();

    if (existing) {
      const [updated] = await this.knex('coach_discovery_profiles')
        .where({ id: existing.id })
        .update({
          bio: data.bio,
          specializations: data.specializations
            ? JSON.stringify(data.specializations)
            : null,
          certifications: data.certifications
            ? JSON.stringify(data.certifications)
            : null,
          availability: data.availability
            ? JSON.stringify(data.availability)
            : null,
          social_links: data.socialLinks
            ? JSON.stringify(data.socialLinks)
            : null,
          updated_at: this.knex.fn.now(),
        })
        .returning('*');
      return this.mapToEntity(updated);
    }
    const [profile] = await this.knex('coach_discovery_profiles')
      .insert({
        id: this.knex.raw('gen_random_uuid()'),
        coach_id: coachId,
        tenant_id: tenantId,
        bio: data.bio,
        specializations: data.specializations
          ? JSON.stringify(data.specializations)
          : null,
        certifications: data.certifications
          ? JSON.stringify(data.certifications)
          : null,
        availability: data.availability
          ? JSON.stringify(data.availability)
          : null,
        social_links: data.socialLinks
          ? JSON.stringify(data.socialLinks)
          : null,
        created_at: this.knex.fn.now(),
        updated_at: this.knex.fn.now(),
      })
      .returning('*');
    return this.mapToEntity(profile);
  }

  async findById(id: string): Promise<CoachDiscoveryProfile | null> {
    const profile = await this.knex('coach_discovery_profiles')
      .where('id', id)
      .first();

    return profile ? this.mapToEntity(profile) : null;
  }

  async findByCoachId(coachId: string): Promise<CoachDiscoveryProfile | null> {
    const profile = await this.knex('coach_discovery_profiles')
      .where('coach_id', coachId)
      .first();

    return profile ? this.mapToEntity(profile) : null;
  }

  async update(
    id: string,
    data: Partial<UpdateCoachDiscoveryProfileRequest> & {
      currentAthletes?: number;
      isAcceptingNewAthletes?: boolean;
    },
  ): Promise<CoachDiscoveryProfile | null> {
    const updateData: any = {
      updated_at: this.knex.fn.now(),
    };

    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.specializations !== undefined)
      updateData.specializations = JSON.stringify(data.specializations);
    if (data.certifications !== undefined)
      updateData.certifications = JSON.stringify(data.certifications);
    if (data.availability !== undefined)
      updateData.availability = JSON.stringify(data.availability);
    if (data.socialLinks !== undefined)
      updateData.social_links = JSON.stringify(data.socialLinks);
    if (data.hourlyRate !== undefined) updateData.hourly_rate = data.hourlyRate;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.isAvailable !== undefined)
      updateData.is_available = data.isAvailable;

    const [profile] = await this.knex('coach_discovery_profiles')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return profile ? this.mapToEntity(profile) : null;
  }

  async search(filters: CoachDiscoveryFilters): Promise<{
    coaches: CoachDiscoveryProfile[];
    total: number;
  }> {
    let query = this.knex('coach_discovery_profiles')
      .leftJoin('users', 'coach_discovery_profiles.coach_id', 'users.id')
      .select(
        'coach_discovery_profiles.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.phone_number',
        'users.profile_image_url',
      );

    // Apply filters
    if (filters.specializations && filters.specializations.length > 0) {
      query = query.whereRaw('specializations::jsonb ?| array[?]', [
        filters.specializations,
      ]);
    }

    if (filters.languages && filters.languages.length > 0) {
      query = query.whereRaw('languages::jsonb ?| array[?]', [
        filters.languages,
      ]);
    }

    if (filters.location) {
      query = query.where('location', 'ilike', `%${filters.location}%`);
    }

    if (filters.maxHourlyRate) {
      query = query.where('hourly_rate', '<=', filters.maxHourlyRate);
    }

    if (filters.minRating) {
      query = query.where('rating', '>=', filters.minRating);
    }

    if (filters.availableSlots) {
      query = query
        .whereRaw('current_athletes < max_athletes')
        .where('is_accepting_new_athletes', true);
    }

    if (filters.search) {
      query = query.where(function () {
        this.where('display_name', 'ilike', `%${filters.search}%`)
          .orWhere('bio', 'ilike', `%${filters.search}%`)
          .orWhere('experience', 'ilike', `%${filters.search}%`);
      });
    }

    // Get total count
    const totalQuery = query.clone().count('* as count').first();
    const { count } = await totalQuery;
    const total = parseInt(count as string, 10);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const coaches = await query
      .orderBy('rating', 'desc')
      .orderBy('review_count', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      coaches: coaches.map((coach) => this.mapToEntity(coach)),
      total,
    };
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await this.knex('coach_discovery_profiles')
      .where('id', id)
      .del();

    return deletedCount > 0;
  }

  async findByUserId(userId: string): Promise<CoachDiscoveryProfile | null> {
    const profile = await this.knex('coach_discovery_profiles')
      .where('coach_id', userId)
      .first();

    return profile ? this.mapToEntity(profile) : null;
  }

  private mapToEntity(row: any): CoachDiscoveryProfile {
    return {
      id: row.id,
      coach_id: row.coach_id,
      tenant_id: row.tenant_id,
      bio: row.bio,
      specializations: row.specializations,
      certifications: row.certifications,
      availability: row.availability,
      socialLinks: row.social_links,
      hourlyRate: row.hourly_rate,
      currency: row.currency,
      is_available: row.is_available,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
