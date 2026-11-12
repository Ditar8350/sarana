<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_mahasiswa_can_update_biodata_akademik(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Dita Ramadani',
                'email' => $user->email,
                'nomor_induk' => '2355202065',
                'no_hp' => '085656206516',
                'fakultas' => 'Fakultas Sains dan Teknologi (FST)',
                'prodi' => 'S1 Matematika',
            ]);

        $response->assertSessionHasNoErrors()->assertRedirect('/profile');

        $user->refresh();
        $this->assertSame('2355202065', $user->nomor_induk);
        $this->assertSame('085656206516', $user->no_hp);
        $this->assertSame('Fakultas Sains dan Teknologi (FST)', $user->fakultas);
        $this->assertSame('S1 Matematika', $user->prodi);
    }

    public function test_prodi_is_required_when_fakultas_is_selected(): void
    {
        $user = User::factory()->create(['role' => 'mahasiswa']);

        $this->actingAs($user)
            ->from('/profile')
            ->patch('/profile', [
                'name' => 'Dita Ramadani',
                'email' => $user->email,
                'fakultas' => 'Fakultas Sains dan Teknologi (FST)',
                'prodi' => '',
            ])
            ->assertSessionHasErrors('prodi');
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
